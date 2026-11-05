import { Link } from 'react-router-dom';

import { STEPS } from './steps';

// The button of a "next step": goes to where the action happens (and opens the add form when it should).
const StepButton = ({ step, className = 'btn-accent px-6 py-3 text-lg' }) => {
  const config = STEPS[step.type];
  return (
    <Link to={config.to} state={config.openForm ? { openForm: true } : undefined} className={className}>
      {config.label}
    </Link>
  );
};

export default StepButton;
