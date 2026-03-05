
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'client');

-- Create workspaces table
CREATE TABLE public.workspaces (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create api_connections table
CREATE TABLE public.api_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  api_key TEXT NOT NULL,
  auto_sync_enabled BOOLEAN NOT NULL DEFAULT true,
  last_synced_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.api_connections ENABLE ROW LEVEL SECURITY;

-- Create campaigns table
CREATE TABLE public.campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  instantly_campaign_id TEXT,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  emails_sent INTEGER NOT NULL DEFAULT 0,
  opens INTEGER NOT NULL DEFAULT 0,
  replies INTEGER NOT NULL DEFAULT 0,
  positive_replies INTEGER NOT NULL DEFAULT 0,
  bounce_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  meetings_booked INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

-- Create campaign_metrics table (time-series)
CREATE TABLE public.campaign_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  emails_sent INTEGER NOT NULL DEFAULT 0,
  opens INTEGER NOT NULL DEFAULT 0,
  replies INTEGER NOT NULL DEFAULT 0,
  positive_replies INTEGER NOT NULL DEFAULT 0,
  bounces INTEGER NOT NULL DEFAULT 0,
  meetings_booked INTEGER NOT NULL DEFAULT 0
);
ALTER TABLE public.campaign_metrics ENABLE ROW LEVEL SECURITY;

-- Create leads table
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  name TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Helper: get user's workspace_id
CREATE OR REPLACE FUNCTION public.get_user_workspace_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT workspace_id FROM public.profiles WHERE id = _user_id
$$;

-- RLS Policies

-- Workspaces: users see own workspace, admins see all
CREATE POLICY "Users see own workspace" ON public.workspaces
  FOR SELECT TO authenticated
  USING (id = public.get_user_workspace_id(auth.uid()) OR public.has_role(auth.uid(), 'admin'));

-- Profiles: users see own profile
CREATE POLICY "Users see own profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid());

CREATE POLICY "System can insert profiles" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

-- User roles: users see own roles
CREATE POLICY "Users see own roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- API connections: users see own workspace connections
CREATE POLICY "Users see own api connections" ON public.api_connections
  FOR SELECT TO authenticated
  USING (workspace_id = public.get_user_workspace_id(auth.uid()) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users update own api connections" ON public.api_connections
  FOR UPDATE TO authenticated
  USING (workspace_id = public.get_user_workspace_id(auth.uid()) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users insert api connections" ON public.api_connections
  FOR INSERT TO authenticated
  WITH CHECK (workspace_id = public.get_user_workspace_id(auth.uid()) OR public.has_role(auth.uid(), 'admin'));

-- Campaigns: workspace-scoped
CREATE POLICY "Users see own campaigns" ON public.campaigns
  FOR SELECT TO authenticated
  USING (workspace_id = public.get_user_workspace_id(auth.uid()) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert campaigns" ON public.campaigns
  FOR INSERT TO authenticated
  WITH CHECK (workspace_id = public.get_user_workspace_id(auth.uid()) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can update campaigns" ON public.campaigns
  FOR UPDATE TO authenticated
  USING (workspace_id = public.get_user_workspace_id(auth.uid()) OR public.has_role(auth.uid(), 'admin'));

-- Campaign metrics: via campaign's workspace
CREATE POLICY "Users see own campaign metrics" ON public.campaign_metrics
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      WHERE c.id = campaign_metrics.campaign_id
      AND (c.workspace_id = public.get_user_workspace_id(auth.uid()) OR public.has_role(auth.uid(), 'admin'))
    )
  );

CREATE POLICY "System can insert campaign metrics" ON public.campaign_metrics
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      WHERE c.id = campaign_metrics.campaign_id
      AND (c.workspace_id = public.get_user_workspace_id(auth.uid()) OR public.has_role(auth.uid(), 'admin'))
    )
  );

-- Leads: workspace-scoped
CREATE POLICY "Users see own leads" ON public.leads
  FOR SELECT TO authenticated
  USING (workspace_id = public.get_user_workspace_id(auth.uid()) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert leads" ON public.leads
  FOR INSERT TO authenticated
  WITH CHECK (workspace_id = public.get_user_workspace_id(auth.uid()) OR public.has_role(auth.uid(), 'admin'));

-- Trigger: auto-create workspace, profile, and role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_workspace_id UUID;
BEGIN
  INSERT INTO public.workspaces (name)
  VALUES (COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email))
  RETURNING id INTO new_workspace_id;

  INSERT INTO public.profiles (id, full_name, workspace_id)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', new_workspace_id);

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'client');

  IF NEW.raw_user_meta_data->>'api_key' IS NOT NULL AND NEW.raw_user_meta_data->>'api_key' != '' THEN
    INSERT INTO public.api_connections (workspace_id, api_key)
    VALUES (new_workspace_id, NEW.raw_user_meta_data->>'api_key');
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_campaigns_updated_at
  BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
