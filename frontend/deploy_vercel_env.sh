export TOKEN="CiN9yG64GC5hQ60J3i53MuJm"

# Function to add env var
add_env() {
  KEY=$1
  VAL=$2
  echo "Adding $KEY..."
  # Input: Value -> Target (Production) -> Target (Preview) -> Target (Dev)
  # We select 'production' (y), then 'y' for others or just 'a' for all? 
  # Vercel CLI flow: 
  # ? What's the value of NAME? value
  # ? Add NAME to which environments? (select with arrows)
  # Providing input via pipe is risky if UI changes.
  # Safer: Use 'vercel env add name [environment] [gitbranch]'? No, CLI doesn't support that fully in all versions.
  # Let's try standard pipe: Value \n Targets (default is all usually or needs selection)
  
  # Actually, `vercel env add` takes KEY name as arg. 
  # Then prompts for value. 
  # Then prompts for environment targeting (checkboxes).
  # Automation via printf is hard on checkboxes.
  
  # ALTERNATIVE: Use `vercel --build-env KEY=VAL` in the deploy command! 
  # This sets it for the BUILD.
}

# Re-deploy with --build-env is much easier/safer for automation.
echo "Redeploying with Build Env Vars..."
npx vercel --prod --token $TOKEN --yes --force \
  --build-env VITE_SUPABASE_URL="https://moulkspffuxigvwlflho.supabase.co" \
  --build-env VITE_SUPABASE_ANON_KEY="UXu6n1wkLR+jqCbP5SuIQhfXGDGTolpX0vES7WWK2Zzfz2kYtsWbrYEMJSSfmc8nrGoA0Jp0rtmQ5GxQOxtGyg==" \
  --build-env VITE_API_BASE_URL="https://capstone-backend-djdd.onrender.com"
