from datetime import timedelta, datetime as dt
import random
import string
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from .. import schemas, models, database
from ..core import security
from ..services.email_service import send_email_notification
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from fastapi import status

router = APIRouter(tags=["Authentication"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")



# Google Auth
from google.oauth2 import id_token
from google.auth.transport import requests


def get_db():
    """Database session dependency"""
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()



@router.get("/auth/test-ping")
def test_ping():
    return {"status": "pong"}

# --- DIRECT REGISTER ENDPOINT ---
@router.post("/auth/register", response_model=schemas.Token)
def register(user_data: schemas.UserCreate, db: Session = Depends(get_db)):
    """
    Register a new user with direct email/password authentication.
    Auto-verifies the user and returns an access token.
    """
    # Check if user already exists
    existing = db.query(models.User).filter(models.User.email == user_data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="User already exists (Email taken)")
    
    # Create new user with hashed password
    hashed_password = security.get_password_hash(user_data.password)
    new_user = models.User(
        email=user_data.email,
        hashed_password=hashed_password,
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        plan=user_data.plan or "lite",
        location_name=user_data.location_name,
        is_verified=True  # Auto-verify for direct registration
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Generate JWT access token
    access_token_expires = timedelta(minutes=security.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={"sub": new_user.email}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "redirect": "/dashboard",
        "plan": new_user.plan,
        "is_verified": new_user.is_verified,
        "user_name": f"{new_user.first_name} {new_user.last_name}"
    }

@router.post("/token", response_model=schemas.Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """
    OAuth2 compatible token login endpoint.
    Authenticates user and returns JWT access token.
    """
    # Fetch user by email
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Verify password
    if not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Generate JWT access token
    access_token_expires = timedelta(minutes=security.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "redirect": "/dashboard",
        "plan": user.plan,
        "is_verified": user.is_verified,
        "user_name": f"{user.first_name} {user.last_name}"
    }


async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """
    Dependency to get the current authenticated user from JWT token.
    Used to protect endpoints that require authentication.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, security.SECRET_KEY, algorithms=[security.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    user = db.query(models.User).filter(models.User.email == username).first()
    
    if user is None:
        raise credentials_exception
    return user
class SignupInitRequest(schemas.BaseModel):
    email: schemas.EmailStr

@router.post("/auth/signup-init")
def signup_init(request: SignupInitRequest, db: Session = Depends(get_db)):
    """
    Initialize signup process by sending OTP verification code to email.
    Creates unverified user record if new, or updates existing unverified user.
    """
    # Check if user already exists
    user = db.query(models.User).filter(models.User.email == request.email).first()
    if user and user.is_verified:
        raise HTTPException(status_code=400, detail="Identity Hash already registered. Please Login.")
    
    # Generate 6-digit OTP code
    otp_code = ''.join(random.choices(string.digits, k=6))
    
    if user and not user.is_verified:
        # Update OTP for existing unverified user
        user.otp_secret = otp_code
        db.commit()
    else:
        # Create new placeholder user
        hashed_password = security.get_password_hash("PENDING-SETUP")
        new_user = models.User(
            email=request.email,
            hashed_password=hashed_password,
            is_verified=False,
            otp_secret=otp_code,
            plan="lite"  # Default plan
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
    
    # Send OTP via email
    subject = "EcoSync S4: Identity Verification Code"
    body = f"""
    [SECURE TRANSMISSION]
    
    Operative,
    
    Your activation code for the Environmental Monitoring Network is:
    
    {otp_code}
    
    Enter this code to proceed to credential setup.
    """
    try:
        send_email_notification(request.email, subject, body)
    except Exception as e:
        # Log email failure (OTP still valid for testing)
        print(f"⚠️ Email notification failed: {e}")
        print(f"📧 OTP Code for {request.email}: {otp_code}")
        
    return {"status": "success", "message": "Verification Signal Sent"}


class SignupCompleteRequest(schemas.BaseModel):
    email: schemas.EmailStr
    otp: str
    password: str
    first_name: str
    last_name: str

@router.post("/auth/signup-complete", response_model=schemas.Token)
def signup_complete(request: SignupCompleteRequest, db: Session = Depends(get_db)):
    """
    Complete signup process by verifying OTP and setting user credentials.
    Returns JWT token upon successful verification.
    """
    user = db.query(models.User).filter(models.User.email == request.email).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User Identity Not Found")
        
    if user.is_verified:
         raise HTTPException(status_code=400, detail="User already verified. Please Login.")

    if user.otp_secret != request.otp:
        raise HTTPException(status_code=400, detail="Invalid Verification Code")

    # Finalize user account with credentials
    user.hashed_password = security.get_password_hash(request.password)
    user.first_name = request.first_name
    user.last_name = request.last_name
    user.is_verified = True
    user.otp_secret = None  # Clear OTP after successful verification
    
    db.commit()
    
    # Generate Token immediately
    access_token_expires = timedelta(minutes=security.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "redirect": "/dashboard",
        "plan": user.plan,
        "is_verified": user.is_verified,
        "user_name": f"{user.first_name} {user.last_name}"
    }

class VerifyRequest(schemas.BaseModel):
    email: str
    otp: str

@router.post("/verify-email")
def verify_email(req: VerifyRequest, db: Session = Depends(get_db)):
    """
    Verify user email with OTP code.
    Returns short-lived token for credential setup.
    """
    user = db.query(models.User).filter(models.User.email == req.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.otp_secret != req.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP Code")
        
    user.is_verified = True
    user.otp_secret = None  # Clear OTP after use
    db.commit()
    
    # Issue temporary access token for credential setup (15 min expiry)
    access_token_expires = timedelta(minutes=15)
    access_token = security.create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    return {
        "status": "success", 
        "message": "Identity Verified",
        "access_token": access_token,
        "token_type": "bearer"
    }

class CredentialsSetup(schemas.BaseModel):
    password: str
    first_name: str
    last_name: str

@router.post("/me/setup-credentials")
def setup_credentials(creds: CredentialsSetup, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Set up user credentials after email verification.
    Updates password and profile information.
    """
    # Update password with secure hash
    current_user.hashed_password = security.get_password_hash(creds.password)
    # Update profile information
    current_user.first_name = creds.first_name
    current_user.last_name = creds.last_name
    
    db.commit()
    db.refresh(current_user)
    
    return {"status": "success", "message": "Credentials Secured. System Access Granted."}

@router.put("/me/profile")
def update_profile(profile: schemas.UserProfileUpdate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Update user profile information.
    Requires authentication.
    """
    current_user.first_name = profile.first_name
    current_user.last_name = profile.last_name
    current_user.mobile = profile.mobile
    current_user.location_name = profile.location_name
        
    db.commit()
    db.refresh(current_user)
    return {"status": "success", "message": "Profile Updated"}

@router.get("/me", response_model=schemas.UserResponse)
def read_users_me(current_user: models.User = Depends(get_current_user)):
    """
    Get current user profile
    """
    return current_user

class LocationUpdateRequest(schemas.BaseModel):
    location_lat: float
    location_lon: float
    location_name: str

@router.put("/api/user/location")
def update_user_location(
    location_data: LocationUpdateRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update user's current location coordinates.
    Enables dynamic location tracking for geofencing alerts.
    """
    
    # Update user location
    current_user.location_lat = location_data.location_lat
    current_user.location_lon = location_data.location_lon
    current_user.location_name = location_data.location_name
    
    db.commit()
    db.refresh(current_user)
    
    return {
        "status": "success",
        "message": "Location updated successfully",
        "location": {
            "name": current_user.location_name,
            "lat": current_user.location_lat,
            "lon": current_user.location_lon
        }
    }


class GoogleLoginRequest(schemas.BaseModel):
    token: str

@router.post("/google-login", response_model=schemas.Token)
def google_login(request: GoogleLoginRequest, db: Session = Depends(get_db)):
    """
    Authenticate user with Google OAuth2 token.
    Auto-registers new users if they don't exist.
    """
    try:
        # Verify Google OAuth2 token
        id_info = id_token.verify_oauth2_token(request.token, requests.Request())

        email = id_info.get("email")
        if not email:
            raise HTTPException(status_code=400, detail="Invalid Google Token: No Email")
            
        # Check if user exists
        user = db.query(models.User).filter(models.User.email == email).first()
        
        if not user:
            # Auto-register new Google user
            hashed_password = security.get_password_hash("google_oauth_auto_generated")
            user = models.User(email=email, hashed_password=hashed_password)
            db.add(user)
            db.commit()
            db.refresh(user)
            
        # Issue JWT access token
        access_token_expires = timedelta(minutes=security.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = security.create_access_token(
            data={"sub": user.email}, expires_delta=access_token_expires
        )
        
        return {
            "access_token": access_token, 
            "token_type": "bearer",
            "redirect": "/dashboard"
        }
        
    except ValueError as e:
         raise HTTPException(status_code=400, detail=f"Invalid Google Token: {str(e)}")

