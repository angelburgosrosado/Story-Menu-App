import re
import sys

with open('Setup.tsx', 'r') as f:
    content = f.read()

# 1. Remove WorkspaceCasting import
content = re.sub(r"import WorkspaceCasting from '\./WorkspaceCasting';\n", "", content)

# 2. Remove WorkspaceCasting usage tab
casting_tab = """        {(!isCyberpunk && activeTab === 'casting') && (
            <WorkspaceCasting />
        )}
"""
content = content.replace(casting_tab, "")

# 3. Add AIAssistButton import
if "import AIAssistButton" not in content:
    content = content.replace("import React,", "import React,\nimport AIAssistButton from './AIAssistButton';\n")

# 4. Left-align CLOUD CREATIVE WORKSPACE ACTIVE
content = content.replace('className="md:col-span-12 text-center font-sans"', 'className="md:col-span-12 text-left font-sans"')
content = content.replace('className="flex-1 text-center"', 'className="flex-1 text-left"')

# 5. Add max-w-7xl mx-auto
content = content.replace(
    'className={`flex-1 overflow-y-auto w-full p-4 md:p-8',
    'className={`flex-1 overflow-y-auto w-full p-4 md:p-8 max-w-7xl mx-auto'
)

# 6. HEIC Support
content = content.replace('accept="image/jpeg,image/png,image/webp,image/gif"', 'accept="image/jpeg,image/png,image/webp,image/gif,image/heic,.heic"')
content = content.replace('JPG, PNG, WEBP, GIF (Max 5MB)', 'JPG, PNG, WEBP, GIF, HEIC (Max 5MB)')

# 7. Add View Completed Arts Gallery Button
gallery_btn = """                                   <button onClick={() => window.location.hash = '#gallery'} className="mt-2 md:mt-0 flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold font-sans transition-all bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm border border-indigo-500/50">
                                        🖼️ View Completed Arts Gallery
                                   </button>
"""
content = content.replace(
    """                              <p className="md:col-span-12 text-sm opacity-80 mb-2 leading-relaxed">
                                   {isEditorial 
                                   ? t('setup.cast.descEditorial') 
                                   : t('setup.cast.descComic')}
                              </p>""",
    f"""                              <div className="md:col-span-12 flex flex-col md:flex-row md:items-center justify-between mb-4">
                                   <p className="text-sm opacity-80 leading-relaxed">
                                        {{isEditorial 
                                        ? t('setup.cast.descEditorial') 
                                        : t('setup.cast.descComic')}}
                                   </p>
{gallery_btn}                              </div>"""
)

# 8. Fix SaaS Colors for Comic Mode
content = content.replace('bg-slate-900 border border-cyan-500/50 shadow-[0_0_15px_rgba(34,211,238,0.2)]', 'bg-slate-900/60 border border-indigo-500/30 shadow-sm')
content = content.replace('border-cyan-500', 'border-indigo-500/50')
content = content.replace('shadow-[0_0_12px_rgba(34,211,238,0.4)]', 'shadow-sm')
content = content.replace('shadow-[0_4px_12px_rgba(0,0,0,0.8)]', 'shadow-md')
content = content.replace('shadow-[0_0_15px_rgba(16,185,129,0.3)]', 'shadow-sm')

# 9. AIAssistButton for Textareas
# Replace "✨ SUGGEST" buttons with AIAssistButton
# For Hero
hero_suggest = r"""<button[^>]*onClick=\{\(e\) => \{ e\.preventDefault\(\); handleSuggestField\('heroVisuals', props\.heroVisuals\); \}\}[^>]*>[\s\S]*?<\/button>"""
content = re.sub(hero_suggest, """<AIAssistButton 
                                                        mode={isEditorial ? 'editorial' : 'comic'} 
                                                        targetField="heroVisuals" 
                                                        currentValue={props.heroVisuals}
                                                        onSuggestion={(val) => props.onHeroVisualsChange(val)} 
                                                    />""", content)

# For Friend
friend_suggest = r"""<button[^>]*onClick=\{\(e\) => \{ e\.preventDefault\(\); handleSuggestField\('friendVisuals', props\.friendVisuals\); \}\}[^>]*>[\s\S]*?<\/button>"""
content = re.sub(friend_suggest, """<AIAssistButton 
                                                        mode={isEditorial ? 'editorial' : 'comic'} 
                                                        targetField="friendVisuals" 
                                                        currentValue={props.friendVisuals}
                                                        onSuggestion={(val) => props.onFriendVisualsChange(val)} 
                                                    />""", content)

# For Villain
villain_suggest = r"""<button[^>]*onClick=\{\(e\) => \{ e\.preventDefault\(\); handleSuggestField\('villainVisuals', props\.villainVisuals\); \}\}[^>]*>[\s\S]*?<\/button>"""
content = re.sub(villain_suggest, """<AIAssistButton 
                                                        mode={isEditorial ? 'editorial' : 'comic'} 
                                                        targetField="villainVisuals" 
                                                        currentValue={props.villainVisuals}
                                                        onSuggestion={(val) => props.onVillainVisualsChange(val)} 
                                                    />""", content)

# 10. Vault Integration
# Replace the empty state of Vault and add ASSIGN roles
vault_html = """
                      {/* CHARACTER VAULT SAVED ITEMS MODULE */}
                      <div className={`mt-8 pt-6 border-t-2 ${isEditorial ? 'border-stone-200' : 'border-slate-800'}`}>
                          <div className="flex justify-between items-center mb-4">
                               <span className={isEditorial ? "font-sans text-sm uppercase text-stone-700 font-black tracking-wider flex items-center gap-2" : "font-sans text-sm uppercase text-indigo-400 font-bold tracking-wider flex items-center gap-2"}>
                                    <span className="text-xl">🗃️</span> {isEditorial ? "Character Index (Stored Profiles)" : "Character Vault (Saved Profiles)"}
                               </span>
                               <span className={isEditorial ? "text-xs font-sans text-stone-500 bg-stone-100 px-2 py-1 rounded" : "text-xs font-sans text-slate-400 bg-slate-900 px-2 py-1 rounded"}>
                                    {savedCharacters.length} / 50 Slots Used
                               </span>
                          </div>
                          
                          {savedCharacters.length === 0 ? (
                              <div className={`w-full py-12 rounded-xl flex flex-col items-center justify-center gap-3 font-sans text-sm ${isEditorial ? 'bg-stone-50 text-stone-500 border-2 border-dashed border-stone-200' : 'bg-slate-900/30 text-slate-500 border-2 border-dashed border-slate-800'}`}>
                                  <span className="text-3xl grayscale opacity-50">🎭</span>
                                  <p>Your Character Vault is empty.</p>
                                  <p className="text-xs opacity-70">Upload a character image in the slots above to automatically save them to your Vault.</p>
                              </div>
                          ) : (
                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                   {savedCharacters.map(char => (
                                        <div key={char.id} className={`group relative p-2 rounded-xl transition-all cursor-pointer flex flex-col ${isEditorial ? 'bg-white border border-stone-200 hover:border-stone-400 hover:shadow-md' : 'bg-slate-900/80 border border-slate-700 hover:border-indigo-500 hover:shadow-lg hover:shadow-indigo-500/10'}`}>
                                             <div className="aspect-[3/4] w-full bg-slate-950 rounded-lg overflow-hidden mb-2 relative">
                                                  <img src={char.imageUrl || char.image_url || 'https://via.placeholder.com/150'} alt={char.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                             </div>
                                             <div className="px-1 flex flex-col flex-1">
                                                 <span className={`font-sans font-bold text-xs truncate block ${isEditorial ? 'text-stone-800' : 'text-slate-200'}`}>{char.name}</span>
                                                 <span className={`text-[10px] truncate block mb-2 ${isEditorial ? 'text-stone-500' : 'text-slate-400'}`}>{char.role_type || 'Unassigned'}</span>
                                                 
                                                 <div className="mt-auto grid grid-cols-1 gap-1">
                                                      <button 
                                                           onClick={() => {
                                                                const persona = { base64: char.imageUrl || char.image_url || '', desc: char.description || '' };
                                                                if (char.role_type === 'Hero' || !char.role_type) props.onSelectHero(persona);
                                                                else if (char.role_type === 'Co-Star' || char.role_type === 'Friend') props.onSelectFriend(persona);
                                                                else if (char.role_type === 'Villain') props.onSelectVillain(persona);
                                                           }}
                                                           className={`text-[10px] py-1 uppercase tracking-wide rounded border transition-colors ${
                                                                isEditorial
                                                                     ? 'bg-stone-100 hover:bg-stone-800 text-stone-700 hover:text-white border-stone-300 font-sans font-bold'
                                                                     : 'bg-indigo-900/30 hover:bg-indigo-600 text-indigo-300 hover:text-white border-indigo-700/50 font-sans font-bold'
                                                           }`}
                                                      >
                                                           {isEditorial ? "ASSIGN ROLE" : "CAST ROLE"}
                                                      </button>
                                                 </div>
                                             </div>
                                        </div>
                                   ))}
                              </div>
                          )}
                      </div>
"""

# Find the old vault code and replace it
# The old vault is under '{/* CHARACTER VAULT SAVED ITEMS MODULE */}' and goes until the end of that div
old_vault_start = content.find('{/* CHARACTER VAULT SAVED ITEMS MODULE */}')
if old_vault_start != -1:
    old_vault_end = content.find('{/* CHARACTER VISUAL COHESION CONTROLS (HAIR & OUTIFT STYLING) */}', old_vault_start)
    if old_vault_end != -1:
        # Check if there is an extra '}' or '{savedCharacters.length > 0 && (' wrapping it
        # Actually it's easier to just replace the chunk directly by extracting it
        chunk_to_remove = content[old_vault_start:old_vault_end]
        content = content.replace(chunk_to_remove, vault_html + "\n\n                        ")

with open('Setup.tsx', 'w') as f:
    f.write(content)

print("Patch applied successfully.")
