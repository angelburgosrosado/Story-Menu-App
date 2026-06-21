import re

with open('AdminApp.tsx', 'r') as f:
    content = f.read()

# Change export const AdminDashboard: React.FC<AdminDashboardProps> = ({ isOpen, onClose }) => {
# to export const AdminApp: React.FC = () => {
content = re.sub(r'export const AdminDashboard: React\.FC<AdminDashboardProps> = \(\{ isOpen, onClose \}\) => \{', 
                 'import { auth } from "./firebase";\nimport { onAuthStateChanged } from "firebase/auth";\nexport const AdminApp: React.FC = () => {\n  const [adminToken, setAdminToken] = useState<string>("");\n  const [authEmail, setAuthEmail] = useState<string>("");\n  const [authLoading, setAuthLoading] = useState(true);', 
                 content)

# We need to add an effect for auth
auth_effect = """
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const token = await user.getIdToken();
        setAdminToken(token);
        setAuthEmail(user.email || '');
      } else {
        setAdminToken('');
        setAuthEmail('');
      }
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (adminToken || (process.env.NODE_ENV !== 'production' && authEmail)) {
      fetchData();
    }
  }, [adminToken, authEmail]);
"""

content = content.replace("  const [loading, setLoading] = useState(true);", "  const [loading, setLoading] = useState(false);\n" + auth_effect)

# Now we need to update fetchData and ALL fetch calls to include Authorization headers!
# I will just write a wrapper for fetch
fetch_wrapper = """
  const adminFetch = async (url: string, options: any = {}) => {
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${adminToken}`,
      'x-admin-email': authEmail
    };
    return fetch(url, { ...options, headers });
  };
"""

content = content.replace("const fetchData = async () => {", fetch_wrapper + "\n  const fetchData = async () => {")

content = content.replace("fetch('/api/admin/", "adminFetch('/api/admin/")
content = content.replace("fetch(`/api/admin/", "adminFetch(`/api/admin/")

# Remove isOpen check
content = re.sub(r'if \(!isOpen\) return null;', '', content)

# Change the main outer div from a modal to a full page utilitarian dashboard
# Old: <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 font-mono text-cyan-500">
# New: <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
content = re.sub(r'<div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 font-mono text-cyan-500">.*?<div className="w-full max-w-6xl bg-slate-900 border border-cyan-500/30 rounded-lg shadow-2xl flex flex-col max-h-\[90vh\] overflow-hidden">',
                 '<div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">\n<div className="flex-1 max-w-7xl mx-auto w-full bg-white shadow-sm border border-gray-200 mt-8 mb-8 rounded-lg overflow-hidden flex flex-col">',
                 content, flags=re.DOTALL)

# Header changes
content = content.replace('className="p-4 border-b border-cyan-500/30 bg-slate-950 flex justify-between items-center"', 'className="p-4 border-b border-gray-200 bg-white flex justify-between items-center"')
content = content.replace('className="text-cyan-400 hover:text-cyan-300"', 'className="text-gray-500 hover:text-gray-800"')
content = content.replace('<Shield className="text-cyan-400" />', '<Shield className="text-blue-600" />')
content = content.replace('text-cyan-400 font-bold', 'text-gray-900 font-semibold')

# Tabs changes
content = content.replace('className="flex border-b border-slate-800"', 'className="flex border-b border-gray-200 bg-gray-50 px-4"')
content = content.replace('border-b-2 border-cyan-400 text-cyan-400', 'border-b-2 border-blue-600 text-blue-600 font-medium')
content = content.replace('border-b-2 border-red-500 text-red-500', 'border-b-2 border-red-600 text-red-600 font-medium')
content = content.replace('text-gray-500 hover:text-gray-300', 'text-gray-500 hover:text-gray-700 font-medium')
content = content.replace('border-b-2 border-fuchsia-400 text-fuchsia-400', 'border-b-2 border-purple-600 text-purple-600 font-medium')

# Table styling
content = content.replace('bg-slate-950 border border-slate-700', 'bg-white border border-gray-200 rounded-md shadow-sm m-4')
content = content.replace('bg-slate-900 text-gray-400 uppercase', 'bg-gray-50 text-gray-500 uppercase font-semibold text-xs border-b border-gray-200')
content = content.replace('border-t border-slate-800 hover:bg-slate-900/50', 'border-t border-gray-200 hover:bg-gray-50')
content = content.replace('text-yellow-400', 'text-orange-600 font-medium')
content = content.replace('text-cyan-400 hover:text-cyan-300', 'text-blue-600 hover:text-blue-800')
content = content.replace('bg-slate-900', 'bg-white')
content = content.replace('border-slate-700', 'border-gray-200')
content = content.replace('border-slate-800', 'border-gray-200')

# Card styling
content = content.replace('bg-slate-900 p-4 rounded border border-slate-800', 'bg-white p-4 rounded-lg shadow-sm border border-gray-200')
content = content.replace('bg-slate-800', 'bg-gray-100')

# Text colors
content = content.replace('text-cyan-400', 'text-blue-600')
content = content.replace('text-gray-400', 'text-gray-500')
content = content.replace('text-white', 'text-gray-900')
content = content.replace('text-green-400', 'text-green-600')
content = content.replace('text-[11px] font-mono', 'text-sm')

# Input styling
content = content.replace('bg-slate-950 border border-slate-700 text-white', 'bg-white border border-gray-300 text-gray-900 rounded-md focus:ring-blue-500 focus:border-blue-500')
content = content.replace('bg-cyan-500 text-slate-900', 'bg-blue-600 text-white hover:bg-blue-700')

# Add an auth wrapper at the top of return
auth_check = """
  if (authLoading) return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading Admin...</div>;
  if (!adminToken && process.env.NODE_ENV === 'production') return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-md border border-gray-200 max-w-md w-full text-center">
              <Shield className="mx-auto text-blue-600 mb-4" size={48} />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Admin Portal</h2>
              <p className="text-gray-500 mb-6">You must be logged in as an administrator to access this area.</p>
              <a href="/" className="bg-blue-600 text-white px-4 py-2 rounded font-medium hover:bg-blue-700">Return to App</a>
          </div>
      </div>
  );
"""

content = content.replace('return (\n        <div className="min-h-screen', auth_check + '\n  return (\n        <div className="min-h-screen')

with open('AdminApp.tsx', 'w') as f:
    f.write(content)
