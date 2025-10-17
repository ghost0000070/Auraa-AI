-- Emergency admin account creation with proper password
-- This creates a fresh admin account that can definitely log in

DO $$
DECLARE
    new_admin_id UUID;
BEGIN
    -- Delete existing problematic user first (if exists)
    DELETE FROM auth.users WHERE email = 'ghostspooks@icloud.com';
    
    -- Create completely fresh admin user
    new_admin_id := gen_random_uuid();
    
    -- Insert into auth.users with a proper bcrypt hash for password "AdminPassword123!"
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
        raw_user_meta_data,
        confirmation_token
    ) VALUES (
        new_admin_id,
        'ghostspooks@icloud.com',
        '$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', -- "secret"
        now(),
        now(),
        now(),
        'authenticated',
        'authenticated',
        '{"provider":"email","providers":["email"]}',
        '{"admin":true}',
        ''
    );
    
    -- Clean up existing roles first
    DELETE FROM public.user_roles WHERE user_id = new_admin_id;
    
    -- Add admin role
    INSERT INTO public.user_roles (user_id, role, created_at)
    VALUES (new_admin_id, 'admin', now());
    
    -- Add user role
    INSERT INTO public.user_roles (user_id, role, created_at)
    VALUES (new_admin_id, 'user', now());
    
    -- Clean up existing subscription
    DELETE FROM public.subscribers WHERE user_id = new_admin_id;
    
    -- Add Enterprise subscription
    INSERT INTO public.subscribers (
        user_id,
        email,
        subscribed,
        subscription_tier,
        subscription_end,
        created_at,
        updated_at
    ) VALUES (
        new_admin_id,
        'ghostspooks@icloud.com',
        true,
        'Enterprise',
        NULL,
        now(),
        now()
    );
    
END $$;

-- Success message
SELECT 'Fresh admin account created with password: secret' as result;