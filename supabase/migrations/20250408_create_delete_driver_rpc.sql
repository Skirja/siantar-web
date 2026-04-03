-- Create RPC function to delete a driver (auth user + profile cascade)
-- This function must be called with SECURITY DEFINER to bypass RLS
CREATE OR REPLACE FUNCTION public.delete_driver(p_driver_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete the auth user (this cascades to profiles via FK)
  DELETE FROM auth.users WHERE id = p_driver_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.delete_driver(UUID) TO authenticated;
