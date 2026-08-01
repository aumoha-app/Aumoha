import React from 'react';
import {
  Dog,
  Cat,
  Bird,
  Fish,
  Rabbit,
  PawPrint,
  Shield,
  Siren,
  Heart,
  Lock,
  Camera,
  Lightbulb,
  ClipboardList,
  MapPin,
  Star,
  Moon,
  Calendar,
  Soup,
  Stethoscope,
  Home,
  Clock,
  User,
  Syringe,
  Leaf,
  Users,
  Bug
} from 'lucide-react';

interface IconProps {
  className?: string;
  size?: number;
  fill?: string;
}

export function PawIcon({ className = "w-5 h-5", size }: IconProps) {
  return <PawPrint className={className} size={size} />;
}

export function DogIcon({ className = "w-5 h-5", size }: IconProps) {
  return <Dog className={className} size={size} />;
}

export function CatIcon({ className = "w-5 h-5", size }: IconProps) {
  return <Cat className={className} size={size} />;
}

export function BirdIcon({ className = "w-5 h-5", size }: IconProps) {
  return <Bird className={className} size={size} />;
}

export function FishIcon({ className = "w-5 h-5", size }: IconProps) {
  return <Fish className={className} size={size} />;
}

export function RabbitIcon({ className = "w-5 h-5", size }: IconProps) {
  return <Rabbit className={className} size={size} />;
}

export function ReptileIcon({ className = "w-5 h-5", size }: IconProps) {
  return <Bug className={className} size={size} />;
}

export function ShieldIcon({ className = "w-5 h-5", size }: IconProps) {
  return <Shield className={className} size={size} />;
}

export function SirenIcon({ className = "w-5 h-5", size }: IconProps) {
  return <Siren className={className} size={size} />;
}

export function HeartIcon({ className = "w-5 h-5", size, fill }: IconProps) {
  return <Heart className={className} size={size} fill={fill || "none"} />;
}

export function LockIcon({ className = "w-5 h-5", size }: IconProps) {
  return <Lock className={className} size={size} />;
}

export function CameraIcon({ className = "w-5 h-5", size }: IconProps) {
  return <Camera className={className} size={size} />;
}

export function LightbulbIcon({ className = "w-5 h-5", size }: IconProps) {
  return <Lightbulb className={className} size={size} />;
}

export function ClipboardIcon({ className = "w-5 h-5", size }: IconProps) {
  return <ClipboardList className={className} size={size} />;
}

export function MapPinIcon({ className = "w-5 h-5", size }: IconProps) {
  return <MapPin className={className} size={size} />;
}

export function StarIcon({ className = "w-5 h-5", size, fill }: IconProps) {
  return <Star className={className} size={size} fill={fill || "none"} />;
}

export function MoonIcon({ className = "w-5 h-5", size }: IconProps) {
  return <Moon className={className} size={size} />;
}

export function CalendarIcon({ className = "w-5 h-5", size }: IconProps) {
  return <Calendar className={className} size={size} />;
}

export function BowlIcon({ className = "w-5 h-5", size }: IconProps) {
  return <Soup className={className} size={size} />;
}

export function StethoscopeIcon({ className = "w-5 h-5", size }: IconProps) {
  return <Stethoscope className={className} size={size} />;
}

export function HouseIcon({ className = "w-5 h-5", size }: IconProps) {
  return <Home className={className} size={size} />;
}

export function ClockIcon({ className = "w-5 h-5", size }: IconProps) {
  return <Clock className={className} size={size} />;
}

export function UserIcon({ className = "w-5 h-5", size }: IconProps) {
  return <User className={className} size={size} />;
}

export function SyringeIcon({ className = "w-5 h-5", size }: IconProps) {
  return <Syringe className={className} size={size} />;
}

export function LeafIcon({ className = "w-5 h-5", size }: IconProps) {
  return <Leaf className={className} size={size} />;
}

export function UsersIcon({ className = "w-5 h-5", size }: IconProps) {
  return <Users className={className} size={size} />;
}
