-- Create the missing ai_employee_deployment_requests table
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

-- Create index
CREATE INDEX IF NOT EXISTS idx_ai_emp_deploy_req_user ON public.ai_employee_deployment_requests(user_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.ai_employee_deployment_requests ENABLE ROW LEVEL SECURITY;

-- Create policies
DO $$ BEGIN
  -- Policy for users to manage their own deployment requests
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE polname='ai_emp_deploy_req_owner_all' AND tablename='ai_employee_deployment_requests') THEN
    CREATE POLICY ai_emp_deploy_req_owner_all ON public.ai_employee_deployment_requests
      FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
  
  -- Policy for admins to manage all deployment requests  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE polname='ai_emp_deploy_req_admin_all' AND tablename='ai_employee_deployment_requests') THEN
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

-- Create trigger for updated_at
CREATE OR REPLACE TRIGGER trg_ai_emp_deploy_req_updated_at
  BEFORE UPDATE ON public.ai_employee_deployment_requests
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();