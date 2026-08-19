import { LoginForm } from "@/components/auth/login-form";

type Props = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

function getErrorMessage(error?: string) {
  switch (error) {
    case "invalid_credentials":
      return "Correo o contraseña incorrectos.";

    case "email_not_confirmed":
      return "Debes confirmar tu correo antes de iniciar sesión.";

    case "profile_not_found":
      return "Tu cuenta existe, pero no está registrada en la iglesia.";

    case "unexpected":
      return "Ocurrió un error inesperado.";

    default:
      return "";
  }
}

export default async function LoginPage({ searchParams }: Props) {
  const params = (await searchParams) ?? {};

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-4 py-10">
      <LoginForm
        errorMessage={getErrorMessage(params.error)}
      />
    </main>
  );
}