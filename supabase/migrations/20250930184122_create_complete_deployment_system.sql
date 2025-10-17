-- Create all missing tables for AI employee deployment system

-- First create user_roles table that's referenced by RLS policies
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'user', 'premium', 'enterprise')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Enable RLS for user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_roles
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='user_roles_read_own' AND tablename='user_roles') THEN
    CREATE POLICY user_roles_read_own ON public.user_roles
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='user_roles_admin_all' AND tablename='user_roles') THEN
    CREATE POLICY user_roles_admin_all ON public.user_roles
      FOR ALL USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role='admin'))
      WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role='admin'));
  END IF;
END $$;

-- Create ai_helper_templates table
CREATE TABLE IF NOT EXISTS public.ai_helper_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  color_scheme TEXT NOT NULL,
  icon_name TEXT NOT NULL DEFAULT 'zap',
  prompt_template TEXT NOT NULL,
  capabilities JSONB DEFAULT '[]'::jsonb,
  tier_requirement TEXT NOT NULL DEFAULT 'basic',
  deployment_eligibility JSONB DEFAULT '{"min_tier": "Premium", "max_employees_per_tier": {"Basic": 1, "Premium": 3, "Enterprise": 10}, "requires_business_profile": true}'::jsonb,
  visibility_level TEXT,
  is_active BOOLEAN DEFAULT true,
  is_public BOOLEAN NOT NULL DEFAULT false,
  user_id UUID,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for ai_helper_templates
ALTER TABLE public.ai_helper_templates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for ai_helper_templates
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='ai_helper_templates_read_access' AND tablename='ai_helper_templates') THEN
    CREATE POLICY "ai_helper_templates_read_access" 
    ON public.ai_helper_templates 
    FOR SELECT 
    USING (
      (is_active = true AND auth.uid() IS NOT NULL) OR 
      (user_id = auth.uid()) OR 
      (created_by = auth.uid())
    );
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='ai_helper_templates_write_access' AND tablename='ai_helper_templates') THEN
    CREATE POLICY "ai_helper_templates_write_access" 
    ON public.ai_helper_templates 
    FOR ALL 
    USING (
      (user_id = auth.uid()) OR 
      (created_by = auth.uid()) OR
      (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role='admin'))
    ) 
    WITH CHECK (
      (user_id = auth.uid()) OR 
      (created_by = auth.uid()) OR
      (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role='admin'))
    );
  END IF;
END $$;

-- Create business_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.business_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  industry TEXT,
  target_audience TEXT,
  website_url TEXT,
  brand_voice TEXT,
  business_data JSONB DEFAULT '{}'::jsonb,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for business_profiles
ALTER TABLE public.business_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for business_profiles
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='business_profiles_owner_all' AND tablename='business_profiles') THEN
    CREATE POLICY business_profiles_owner_all ON public.business_profiles
      FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='business_profiles_admin_all' AND tablename='business_profiles') THEN
    CREATE POLICY business_profiles_admin_all ON public.business_profiles
      FOR ALL USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role='admin'))
      WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role='admin'));
  END IF;
END $$;

-- Now create ai_employee_deployment_requests table with proper foreign keys
CREATE TABLE IF NOT EXISTS public.ai_employee_deployment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  helper_template_id UUID REFERENCES public.ai_helper_templates(id) ON DELETE SET NULL,
  business_profile_id UUID REFERENCES public.business_profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  deployment_config JSONB DEFAULT '{}'::jsonb,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_ai_helper_templates_user ON public.ai_helper_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_business_profiles_user_id ON public.business_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_emp_deploy_req_user ON public.ai_employee_deployment_requests(user_id, created_at DESC);

-- Enable RLS for ai_employee_deployment_requests
ALTER TABLE public.ai_employee_deployment_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for ai_employee_deployment_requests
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='ai_emp_deploy_req_owner_all' AND tablename='ai_employee_deployment_requests') THEN
    CREATE POLICY ai_emp_deploy_req_owner_all ON public.ai_employee_deployment_requests
      FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='ai_emp_deploy_req_admin_all' AND tablename='ai_employee_deployment_requests') THEN
    CREATE POLICY ai_emp_deploy_req_admin_all ON public.ai_employee_deployment_requests
      FOR ALL USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role='admin'))
      WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role='admin'));
  END IF;
END $$;

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE OR REPLACE TRIGGER trg_ai_helper_templates_updated_at
  BEFORE UPDATE ON public.ai_helper_templates
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

CREATE OR REPLACE TRIGGER trg_business_profiles_updated_at
  BEFORE UPDATE ON public.business_profiles
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

CREATE OR REPLACE TRIGGER trg_ai_emp_deploy_req_updated_at
  BEFORE UPDATE ON public.ai_employee_deployment_requests
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

-- Check subscription tier and deployment limits before creating a deployment request
CREATE OR REPLACE FUNCTION public.check_ai_employee_deployment_limits(
  user_id UUID,
  helper_template_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
  max_employees INTEGER;
  current_employees INTEGER;
  min_tier TEXT;
  requires_business_profile BOOLEAN;
  has_business_profile BOOLEAN;
BEGIN
  -- Get user role
  SELECT role INTO user_role FROM public.user_roles WHERE user_id = check_ai_employee_deployment_limits.user_id;

  -- Get deployment eligibility from ai_helper_templates
  SELECT (deployment_eligibility ->> 'min_tier')::TEXT, (deployment_eligibility -> 'max_employees_per_tier' ->> COALESCE(user_role, 'Basic'))::INTEGER, (deployment_eligibility ->> 'requires_business_profile')::BOOLEAN
  INTO min_tier, max_employees, requires_business_profile
  FROM public.ai_helper_templates
  WHERE id = helper_template_id;

  -- Check if user meets the minimum tier requirement
  IF user_role IS NULL OR CASE 
    WHEN min_tier = 'Premium' THEN user_role NOT IN ('premium', 'enterprise', 'admin')
    WHEN min_tier = 'Enterprise' THEN user_role != 'enterprise'
    ELSE FALSE -- No tier requirement
  END THEN
    RAISE EXCEPTION 'User does not meet the minimum tier requirement for this AI employee template.';
  END IF;

  -- Check if user has a business profile when required
  IF requires_business_profile = TRUE THEN
    SELECT EXISTS (SELECT 1 FROM public.business_profiles WHERE user_id = check_ai_employee_deployment_limits.user_id) INTO has_business_profile;
    IF NOT has_business_profile THEN
      RAISE EXCEPTION 'User must have a business profile to deploy this AI employee.';
    END IF;
  END IF;

  -- Get current number of deployed AI employees for the user
  SELECT COUNT(*) INTO current_employees FROM public.ai_employee_deployment_requests WHERE user_id = check_ai_employee_deployment_limits.user_id AND status = 'approved';

  -- Check if user has reached the maximum number of deployed AI employees for their tier
  IF current_employees >= max_employees THEN
    RAISE EXCEPTION 'User has reached the maximum number of deployed AI employees for their tier.';
  END IF;

  RETURN TRUE;
END;
$$
LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to the function
GRANT EXECUTE ON FUNCTION public.check_ai_employee_deployment_limits(UUID, UUID) TO authenticated, service_role;

-- Add a check constraint to ai_employee_deployment_requests table to enforce the limits
ALTER TABLE public.ai_employee_deployment_requests
ADD CONSTRAINT check_deployment_limits
BEFORE INSERT OR UPDATE ON public.ai_employee_deployment_requests
FOR EACH ROW
EXECUTE FUNCTION public.check_ai_employee_deployment_limits(NEW.user_id, NEW.helper_template_id);