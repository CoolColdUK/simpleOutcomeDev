import {Suspense} from 'react';
import LoginPageForm from './LoginPageForm';

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageForm />
    </Suspense>
  );
}
