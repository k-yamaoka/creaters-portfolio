-- Add 'mp4' to video_platform enum
ALTER TYPE video_platform ADD VALUE IF NOT EXISTS 'mp4';

-- Also add 'direct' for any direct video URLs
ALTER TYPE video_platform ADD VALUE IF NOT EXISTS 'direct';
