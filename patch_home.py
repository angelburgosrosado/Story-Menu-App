with open('Home.tsx', 'r') as f:
    content = f.read()

# Add import
import_target = """import { KidsStoryCreator } from './KidsStoryCreator';"""
import_replacement = """import { KidsStoryCreator } from './KidsStoryCreator';
import { CommunityGallery } from './CommunityGallery';"""

content = content.replace(import_target, import_replacement)

# Add state
state_target = """  const [isSandboxOpen, setIsSandboxOpen] = useState(false);"""
state_replacement = """  const [isSandboxOpen, setIsSandboxOpen] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);"""

content = content.replace(state_target, state_replacement)

# Add gallery button in header nav
nav_target = """            <button 
              className="p-3 bg-fuchsia-600 hover:bg-fuchsia-500 font-bold uppercase text-white shadow-[4px_4px_0px_#000] border-2 border-black transition-transform active:translate-x-1 active:translate-y-1"
              onClick={() => setIsSandboxOpen(true)}
            >
              Start Creating
            </button>"""

nav_replacement = """            <button 
              className="p-3 bg-transparent border-2 border-cyan-400 text-cyan-400 hover:bg-cyan-900/30 font-bold uppercase transition-colors"
              onClick={() => setIsGalleryOpen(true)}
            >
              Explore Gallery
            </button>
            <button 
              className="p-3 bg-fuchsia-600 hover:bg-fuchsia-500 font-bold uppercase text-white shadow-[4px_4px_0px_#000] border-2 border-black transition-transform active:translate-x-1 active:translate-y-1"
              onClick={() => setIsSandboxOpen(true)}
            >
              Start Creating
            </button>"""

content = content.replace(nav_target, nav_replacement)

# Add Gallery Component
render_target = """      <AdminDashboard isOpen={isAdminOpen} onClose={() => setIsAdminOpen(false)} />"""
render_replacement = """      <AdminDashboard isOpen={isAdminOpen} onClose={() => setIsAdminOpen(false)} />
      <CommunityGallery isOpen={isGalleryOpen} onClose={() => setIsGalleryOpen(false)} />"""

content = content.replace(render_target, render_replacement)

with open('Home.tsx', 'w') as f:
    f.write(content)

print("Home.tsx patched to include CommunityGallery!")
