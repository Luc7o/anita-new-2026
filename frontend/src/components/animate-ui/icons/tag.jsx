import { motion } from "motion/react";
import {
  getVariants,
  useAnimateIconContext,
  IconWrapper
} from "@animate-ui/react/icons";
const animations = {
  default: {
    group: {
      initial: { rotate: 0, transformOrigin: "27.5% 27.5%" },
      animate: {
        rotate: [0, 8, -6, 3, 0],
        transformOrigin: "27.5% 27.5%",
        transition: { duration: 0.8, ease: "easeInOut" }
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
  ><motion.g variants={variants.group} initial="initial" animate={controls}><path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z" /><circle cx={7.5} cy={7.5} r={0.5} /></motion.g></motion.svg>;
}
function Tag(props) {
  return <IconWrapper icon={IconComponent} {...props} />;
}
export {
  Tag,
  Tag as TagIcon,
  animations
};
