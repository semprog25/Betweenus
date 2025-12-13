import { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { Camera, Upload, X, User, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { toast } from 'sonner';

interface ProfilePictureUploadProps {
  currentImage?: string;
  onImageChange: (imageUrl: string) => void;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  editable?: boolean;
}

// Default avatar colors
const AVATAR_COLORS = [
  'from-purple-500 to-fuchsia-500',
  'from-blue-500 to-cyan-500',
  'from-pink-500 to-rose-500',
  'from-orange-500 to-amber-500',
  'from-green-500 to-emerald-500',
  'from-indigo-500 to-purple-500',
];

export function ProfilePictureUpload({ 
  currentImage, 
  onImageChange, 
  size = 'md',
  editable = true 
}: ProfilePictureUploadProps) {
  const [image, setImage] = useState(currentImage);
  const [isUploading, setIsUploading] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
    xl: 'w-40 h-40',
  };

  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-16 h-16',
  };

  // Handle file selection
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be smaller than 5MB');
      return;
    }

    setIsUploading(true);
    try {
      // Convert to base64 for preview
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setImage(base64String);
        onImageChange(base64String);
        toast.success('Profile picture updated! 📸');
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    } finally {
      setIsUploading(false);
      setShowOptions(false);
    }
  };

  // Handle avatar selection
  const handleSelectAvatar = (gradient: string) => {
    const avatarUrl = `avatar:${gradient}`;
    setImage(avatarUrl);
    onImageChange(avatarUrl);
    setShowOptions(false);
    toast.success('Avatar updated! ✨');
  };

  // Remove current image
  const handleRemoveImage = () => {
    setImage(undefined);
    onImageChange('');
    setShowOptions(false);
    toast.success('Profile picture removed');
  };

  const isDefaultAvatar = image?.startsWith('avatar:');
  const gradient = isDefaultAvatar ? image.replace('avatar:', '') : AVATAR_COLORS[0];

  return (
    <div className="relative inline-block">
      {/* Profile Picture Display */}
      <div className={`${sizeClasses[size]} rounded-full overflow-hidden relative group`}>
        {image && !isDefaultAvatar ? (
          <img 
            src={image} 
            alt="Profile" 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
            <User className={`${iconSizes[size]} text-white`} strokeWidth={1.5} />
          </div>
        )}

        {/* Edit Overlay */}
        {editable && (
          <button
            onClick={() => setShowOptions(!showOptions)}
            className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
          >
            {isUploading ? (
              <Loader2 className="w-6 h-6 text-white animate-spin" />
            ) : (
              <Camera className="w-6 h-6 text-white" />
            )}
          </button>
        )}
      </div>

      {/* Options Menu */}
      {showOptions && editable && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 z-50 min-w-[280px]"
        >
          {/* Close Button */}
          <button
            onClick={() => setShowOptions(false)}
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 dark:text-white">Choose Profile Picture</h4>

            {/* Upload Photo Button */}
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="w-full justify-start gap-2"
            >
              <Upload className="w-4 h-4" />
              Upload Photo
            </Button>

            {/* Default Avatars */}
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Or choose an avatar:</p>
              <div className="grid grid-cols-3 gap-2">
                {AVATAR_COLORS.map((color, index) => (
                  <button
                    key={index}
                    onClick={() => handleSelectAvatar(color)}
                    className={`w-12 h-12 rounded-full bg-gradient-to-br ${color} hover:scale-110 transition-transform flex items-center justify-center ${
                      image === `avatar:${color}` ? 'ring-2 ring-purple-500 ring-offset-2 dark:ring-offset-gray-800' : ''
                    }`}
                  >
                    <User className="w-6 h-6 text-white" strokeWidth={1.5} />
                  </button>
                ))}
              </div>
            </div>

            {/* Remove Button */}
            {image && (
              <Button
                onClick={handleRemoveImage}
                variant="outline"
                className="w-full justify-start gap-2 text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <X className="w-4 h-4" />
                Remove Picture
              </Button>
            )}
          </div>
        </motion.div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}
