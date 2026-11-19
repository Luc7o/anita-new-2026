import { motion } from "motion/react";
import {
  getVariants,
  useAnimateIconContext,
  IconWrapper
} from "@animate-ui/react/icons";
const animations = {
  default: {
    path: {
      initial: {
        pathLength: 1,
        opacity: 1,
        scale: 1
      },
      animate: {
        pathLength: [0, 1],
        opacity: [0, 1],
        scale: [1, 1.1, 1],
        transition: {
          duration: 0.6,
          ease: "easeInOut"
        }
      }
    }
  }
};
function IconComponent({ size, ...props }) {
  const { controls } = useAnimateIconContext();
  const variants = getVariants(animations);
  return <motion.svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    initial="initial"
    animate={controls}
    {...props}
  ><motion.path
    d="m4 12 5 5L20 6"
    variants={variants.path}
    initial="initial"
    animate={controls}
  /></motion.svg>;
}
function Check(props) {
  return <IconWrapper icon={IconComponent} {...props} />;
}
export {
  Check,
  Check as CheckIcon,
  animations
};
