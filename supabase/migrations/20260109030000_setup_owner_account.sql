-- Find owner by email and set up their account
-- Owner email: fckit006@icloud.com

-- First, get the user_id for the owner email
DO $$
DECLARE
    owner_uid UUID;
BEGIN
    -- Get user ID from users table
    SELECT id INTO owner_uid FROM public.users WHERE email = 'fckit006@icloud.com';
    
    IF owner_uid IS NULL THEN
        RAISE NOTICE 'Owner not found in users table, checking auth.users...';
        -- Try auth.users
        SELECT id INTO owner_uid FROM auth.users WHERE email = 'fckit006@icloud.com';
    END IF;
    
    IF owner_uid IS NULL THEN
        RAISE EXCEPTION 'Owner email fckit006@icloud.com not found in database!';
    END IF;
    
    RAISE NOTICE 'Found owner with ID: %', owner_uid;
    
    -- Create business profile if not exists
    INSERT INTO business_profiles (user_id, business_name, industry, description, target_audience, website_url)
    VALUES (
        owner_uid,
        'Auraa AI',
        'Technology',
        'AI workforce platform that deploys autonomous AI employees for businesses',
        'Small to medium businesses looking to automate workflows with AI',
        'https://auraa-ai.com'
    )
    ON CONFLICT (user_id) DO NOTHING;
    
    RAISE NOTICE 'Business profile ensured for owner';
    
    -- Deploy AI employees
    INSERT INTO deployed_employees (user_id, name, role, category, template_id, status, configuration)
    VALUES 
        (owner_uid, 'Marketing Pro', 'Marketing Manager', 'Marketing', 'marketing-pro', 'active', '{"deployed_via": "migration"}'),
        (owner_uid, 'Sales Sidekick', 'Sales Representative', 'Sales', 'sales-sidekick', 'active', '{"deployed_via": "migration"}'),
        (owner_uid, 'Business Analyst', 'Data Analyst', 'Analytics', 'business-analyst', 'active', '{"deployed_via": "migration"}')
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Deployed 3 AI employees for owner';
END $$;
