-- Restore admin account - simplified version
-- Create admin account ghostspooks@icloud.com

DO $$
DECLARE
    admin_user_id UUID;
    existing_user_count INT;
BEGIN
    -- Check if user already exists
    SELECT COUNT(*) INTO existing_user_count FROM auth.users WHERE email = 'ghostspooks@icloud.com';
    
    IF existing_user_count = 0 THEN
        -- Create new admin user
        admin_user_id := gen_random_uuid();
        
        INSERT INTO auth.users (
            id,
            email,
            encrypted_password,
            email_confirmed_at,
            created_at,
            updated_at,
            role,
            aud,
            raw_app_meta_data,
            raw_user_meta_data
        ) VALUES (
            admin_user_id,
            'ghostspooks@icloud.com',
            '$2a$10$dummy.hash.for.admin.account.placeholder',
            now(),
            now(),
            now(),
            'authenticated',
            'authenticated',
            '{"provider":"email","providers":["email"]}',
            '{"admin":true}'
        );
    ELSE
        -- Get existing user ID
        SELECT id INTO admin_user_id FROM auth.users WHERE email = 'ghostspooks@icloud.com';
        
        -- Update existing user
        UPDATE auth.users 
        SET raw_user_meta_data = '{"admin":true}',
            updated_at = now(),
            email_confirmed_at = COALESCE(email_confirmed_at, now())
        WHERE id = admin_user_id;
    END IF;
    
    -- Add admin role (only if doesn't exist)
    IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = admin_user_id AND role = 'admin') THEN
        INSERT INTO public.user_roles (user_id, role, created_at)
        VALUES (admin_user_id, 'admin', now());
    END IF;
    
    -- Add user role (only if doesn't exist)
    IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = admin_user_id AND role = 'user') THEN
        INSERT INTO public.user_roles (user_id, role, created_at)
        VALUES (admin_user_id, 'user', now());
    END IF;
    
    -- Create business profile (only if doesn't exist)
    IF NOT EXISTS (SELECT 1 FROM public.business_profiles WHERE user_id = admin_user_id) THEN
        INSERT INTO public.business_profiles (
            user_id,
            name,
            description,
            industry,
            target_audience,
            website_url,
            brand_voice,
            business_data,
            is_default,
            is_active,
            created_at,
            updated_at
        ) VALUES (
            admin_user_id,
            'Auraa-Ai',
            'AI-powered business automation platform',
            'Technology', 
            'Businesses seeking AI automation',
            'https://auraa.ai',
            'Professional, innovative, helpful',
            '{"admin_account": true, "unlimited_access": true}',
            true,
            true,
            now(),
            now()
        );
    ELSE
        -- Update existing business profile
        UPDATE public.business_profiles 
        SET updated_at = now(),
            business_data = '{"admin_account": true, "unlimited_access": true}',
            is_active = true
        WHERE user_id = admin_user_id;
    END IF;
        
END $$;

-- Create helper functions for admin privileges
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles ur 
        WHERE ur.user_id = $1 AND ur.role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Success message
SELECT 'Admin account ghostspooks@icloud.com restored successfully' as result;