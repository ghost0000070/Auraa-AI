
import React from 'react';

interface TemplateIconProps {
  icon: React.ElementType | string;
  className?: string;
}

export const TemplateIcon: React.FC<TemplateIconProps> = ({ icon, className }) => {
  if (typeof icon === 'string') {
    return <img src={icon} alt="icon" className={className} />;
  }

  const IconComponent = icon;
  return <IconComponent className={className} />;
};
