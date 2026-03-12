import React, { useState } from 'react';
import { Image } from 'cloudinary-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const CloudinaryUpload = ({ onUploadSuccess }) => {
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState('');

  const cloudName = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET;

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);
    formData.append('cloud_name', cloudName);
    formData.append('folder', 'flowerbookie/products');

    try {
      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        formData
      );
      
      setImageUrl(response.data.secure_url);
      toast.success('Image uploaded successfully!');
      
      if (onUploadSuccess) {
        onUploadSuccess(response.data.secure_url, response.data.public_id);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="cloudinary-upload">
      <input
        type="file"
        accept="image/*"
        onChange={handleUpload}
        disabled={uploading}
        className="mb-4"
      />
      {uploading && <p>Uploading...</p>}
      {imageUrl && (
        <div>
          <Image
            cloudName={cloudName}
            publicId={imageUrl.split('/').pop().split('.')[0]}
            width="200"
            crop="scale"
          />
        </div>
      )}
    </div>
  );
};

export default CloudinaryUpload;