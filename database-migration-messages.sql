-- Messages Table Migration
-- This script sets up the messaging system for admin-bubbler communication

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    job_assignment_id UUID REFERENCES job_assignments(id) ON DELETE CASCADE,
    from_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    to_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    attachments JSONB, -- Store file attachments as JSON
    read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_job_assignment_id ON messages(job_assignment_id);
CREATE INDEX IF NOT EXISTS idx_messages_from_user_id ON messages(from_user_id);
CREATE INDEX IF NOT EXISTS idx_messages_to_user_id ON messages(to_user_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_read ON messages(read);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_messages_updated_at 
    BEFORE UPDATE ON messages 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can read messages where they are the sender or recipient
CREATE POLICY "Users can view their own messages" ON messages
    FOR SELECT USING (
        auth.uid() = from_user_id OR 
        auth.uid() = to_user_id
    );

-- Users can insert messages
CREATE POLICY "Users can send messages" ON messages
    FOR INSERT WITH CHECK (
        auth.uid() = from_user_id
    );

-- Users can update their own messages (for marking as read)
CREATE POLICY "Users can update their own messages" ON messages
    FOR UPDATE USING (
        auth.uid() = to_user_id
    );

-- Grant permissions
GRANT ALL ON messages TO authenticated;
GRANT USAGE ON SEQUENCE messages_id_seq TO authenticated;

-- Create storage bucket for message attachments (if using Supabase Storage)
-- Note: This needs to be done in the Supabase dashboard or via API
-- INSERT INTO storage.buckets (id, name, public) VALUES ('message-files', 'message-files', true);

-- Create storage policy for message attachments
-- CREATE POLICY "Users can upload message attachments" ON storage.objects
--     FOR INSERT WITH CHECK (
--         bucket_id = 'message-files' AND 
--         auth.uid() IS NOT NULL
--     );

-- CREATE POLICY "Users can view message attachments" ON storage.objects
--     FOR SELECT USING (
--         bucket_id = 'message-files' AND 
--         auth.uid() IS NOT NULL
--     );

-- Add comments for documentation
COMMENT ON TABLE messages IS 'Stores messages between admins and bubblers for job assignments';
COMMENT ON COLUMN messages.job_assignment_id IS 'Reference to the job assignment this message is about';
COMMENT ON COLUMN messages.from_user_id IS 'User who sent the message';
COMMENT ON COLUMN messages.to_user_id IS 'User who should receive the message';
COMMENT ON COLUMN messages.message IS 'The message content';
COMMENT ON COLUMN messages.attachments IS 'JSON array of file attachments with name, url, type, and size';
COMMENT ON COLUMN messages.read IS 'Whether the message has been read by the recipient';
COMMENT ON COLUMN messages.read_at IS 'Timestamp when the message was read'; 