from datetime import timedelta
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
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/token", response_model=schemas.Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
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
@router.post("/register", response_model=schemas.UserResponse)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    # Check if email exists
    existing_user = db.query(models.User).filter(models.User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Identity Hash already registered on network.")
    
    hashed_password = security.get_password_hash(user.password)
    
    # Generate 6-digit OTP
    otp_code = ''.join(random.choices(string.digits, k=6))
    
    # Send Email
    subject = "S4 SECURITY CHECK: Identity Verification"
    body = f"""
    [SECURE TRANSMISSION]
    
    Operative,
    
    Your requested access code for the Environmental Command Center is:
    
    {otp_code}
    
    Enter this code immediately to calibrate your identity badge.
    
    Session ID: {security.get_password_hash(otp_code)[:8]}
    """
    email_sent = send_email_notification(user.email, subject, body)
    
    if not email_sent:
        print(f"⚠️ Failed to dispatch email to {user.email}. Check server logs.")
        # We proceed anyway so they can try to re-send or manual override if we implement it later.
        # Ideally we might throw an error, but for now let's allow "creation" but they might be stuck if they can't get OTP.
        # Actually, let's print it too for fallback debugging in this demo presentation.
        print(f"DEBUG FALLBACK OTP: {otp_code}")

    new_user = models.User(
        email=user.email,
        hashed_password=hashed_password,
        plan=user.plan,
        first_name=user.first_name,
        last_name=user.last_name,
        is_verified=False,
        otp_secret=otp_code
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

class VerifyRequest(schemas.BaseModel):
    email: str
    otp: str

@router.post("/verify-email")
def verify_email(req: VerifyRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == req.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.otp_secret != req.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP Code")
        
    user.is_verified = True
    user.otp_secret = None # Clear OTP after use
    db.commit()
    
    return {"status": "success", "message": "Identity Verified"}

class UserUpdate(schemas.BaseModel):
    first_name: str
    last_name: str

@router.put("/me/profile")
def update_profile(profile: UserUpdate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    current_user.first_name = profile.first_name
    current_user.last_name = profile.last_name
    db.commit()
    db.refresh(current_user)
    return {"status": "success", "message": "Profile Updated"}

class GoogleLoginRequest(schemas.BaseModel):
    token: str

@router.post("/google-login", response_model=schemas.Token)
def google_login(request: GoogleLoginRequest, db: Session = Depends(get_db)):
    try:
        # Verify Token
        id_info = id_token.verify_oauth2_token(request.token, requests.Request())

        email = id_info.get("email")
        if not email:
            raise HTTPException(status_code=400, detail="Invalid Google Token: No Email")
            
        # Check User
        user = db.query(models.User).filter(models.User.email == email).first()
        
        if not user:
            # Auto-Register
            hashed_password = security.get_password_hash("google_oauth_auto_generated")
            user = models.User(email=email, hashed_password=hashed_password)
            db.add(user)
            db.commit()
            db.refresh(user)
            
        # Issue JWT
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

