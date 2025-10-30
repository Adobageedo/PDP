// Central export for all style constants
export { buttonStyles } from './buttonStyles';
export { cardStyles } from './cardStyles';
export { formStyles } from './formStyles';
export { textStyles } from './textStyles';
export { layoutStyles } from './layoutStyles';
export { badgeStyles } from './badgeStyles';

// Combined styles object for convenience
export const styles = {
  button: buttonStyles,
  card: cardStyles,
  form: formStyles,
  text: textStyles,
  layout: layoutStyles,
  badge: badgeStyles,
};

// Re-export individual style modules
import { buttonStyles } from './buttonStyles';
import { cardStyles } from './cardStyles';
import { formStyles } from './formStyles';
import { textStyles } from './textStyles';
import { layoutStyles } from './layoutStyles';
import { badgeStyles } from './badgeStyles';

export default styles;
