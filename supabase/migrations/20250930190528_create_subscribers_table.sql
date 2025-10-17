-- Create subscribers table for subscription management
CREATE TABLE IF NOT EXISTS public.subscribers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    subscribed BOOLEAN DEFAULT false,
    subscription_tier TEXT,
    subscription_end TIMESTAMPTZ,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY IF NOT EXISTS subscribers_read_own ON public.subscribers
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS subscribers_admin_all ON public.subscribers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur 
            WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
        )
    );

-- Insert admin subscription record for ghostspooks@icloud.com
INSERT INTO public.subscribers (user_id, email, subscribed, subscription_tier, subscription_end)
SELECT 
    u.id,
    u.email,
    true,
    'Enterprise',
    NULL  -- NULL means unlimited/lifetime access
FROM auth.users u
WHERE u.email = 'ghostspooks@icloud.com'
ON CONFLICT (user_id) DO UPDATE SET
    subscribed = true,
    subscription_tier = 'Enterprise',
    subscription_end = NULL,
    updated_at = now();

-- Success message
SELECT 'Subscribers table created and admin subscription added' as result;