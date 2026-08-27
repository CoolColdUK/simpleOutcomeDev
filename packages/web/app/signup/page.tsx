import {Suspense} from 'react';
import SignupPageForm from './SignupPageForm';

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupPageForm />
    </Suspense>
  );
}
