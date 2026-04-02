import '../index.css';
import { RoleProvider } from '../context/RoleContext';

export const metadata = {
  title: 'AccuFlow',
  description: 'AccuFlow Ecclesiastical Systems',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <RoleProvider>
          {children}
        </RoleProvider>
      </body>
    </html>
  );
}
