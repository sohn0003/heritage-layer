
-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  name TEXT,
  subscription_tier TEXT NOT NULL DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- has_role security definer function
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create assets table
CREATE TABLE public.assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  address TEXT NOT NULL,
  asset_type TEXT NOT NULL,
  zoning TEXT,
  building_coverage NUMERIC,
  floor_area_ratio NUMERIC,
  land_area NUMERIC,
  idle_years INTEGER,
  ownership_type TEXT,
  grade TEXT CHECK (grade IN ('S', 'A', 'B', 'C', 'D')),
  gov_cooperation BOOLEAN DEFAULT false,
  latitude NUMERIC,
  longitude NUMERIC,
  admin_memo TEXT,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

-- Public can see published assets (excluding admin_memo)
CREATE POLICY "Anyone can view published assets" ON public.assets
  FOR SELECT USING (is_published = true);

-- Admins can do everything on assets
CREATE POLICY "Admins can manage assets" ON public.assets
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Create saved_assets table
CREATE TABLE public.saved_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, asset_id)
);
ALTER TABLE public.saved_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own saved assets" ON public.saved_assets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can save assets" ON public.saved_assets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unsave assets" ON public.saved_assets FOR DELETE USING (auth.uid() = user_id);

-- Create deal_signals table
CREATE TABLE public.deal_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  signal_type TEXT NOT NULL CHECK (signal_type IN ('saved', 'viewed', 'deal_interest')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.deal_signals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own signals" ON public.deal_signals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create signals" ON public.deal_signals FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create partner_inquiries table
CREATE TABLE public.partner_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  organization TEXT NOT NULL,
  contact TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.partner_inquiries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit inquiry" ON public.partner_inquiries FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view inquiries" ON public.partner_inquiries FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
