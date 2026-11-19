import { motion } from "motion/react";
import {
  getVariants,
  useAnimateIconContext,
  IconWrapper
} from "@animate-ui/react/icons";
const animations = {
  default: {
    path1: {
      initial: { rotate: 0, transition: { duration: 0.4, ease: "easeInOut" } },
      animate: {
        rotate: 180,
        transition: { duration: 0.4, ease: "easeInOut" }
      }
    }
  },
  shrink: {
    path1: {},
    left: {
      initial: { pathLength: 1 },
      animate: {
        pathLength: [1, 0, 1],
        transition: { duration: 0.9, times: [0, 0.4, 1], ease: "easeInOut" }
      }
    },
    right: {
      initial: { pathLength: 1 },
      animate: {
        pathLength: [1, 0, 1],
        transition: { duration: 0.9, times: [0, 0.4, 1], ease: "easeInOut" }
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
    {...props}
  ><motion.g variants={variants.path1} initial="initial" animate={controls}><motion.path
    d="M12 12H5"
    variants={variants.left}
    initial="initial"
    animate={controls}
  /><motion.path
    d="M12 12h7"
    variants={variants.right}
    initial="initial"
    animate={controls}
  /></motion.g></motion.svg>;
}
function Minus(props) {
  return <IconWrapper icon={IconComponent} {...props} />;
}
export {
  Minus,
  Minus as MinusIcon,
  animations
};
