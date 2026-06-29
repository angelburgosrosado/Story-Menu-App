import re

with open('AdminApp.tsx', 'r') as f:
    content = f.read()

# 1. Add handleCreateGlobalCharacter
handle_logic = """
  const handleCreateGlobalCharacter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGlobalChar.name) return;
    try {
      await adminFetch('/api/admin/characters/global', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          character_name: newGlobalChar.name,
          role_type: newGlobalChar.role,
          description: newGlobalChar.desc,
          image_url: newGlobalChar.image,
          generation_prompt: newGlobalChar.generationPrompt,
          reference_images: newGlobalChar.referenceImages
        })
      });
      setNewGlobalChar({ name: "", role: "Hero", desc: "", image: "", generationPrompt: "", referenceImages: [] });
      fetchGlobalCharacters();
    } catch (err) {
      console.error(err);
    }
  };
"""

target_fetchData = "  const fetchData = async () => {"
content = content.replace(target_fetchData, handle_logic + "\n" + target_fetchData)

# 2. Add the global_characters tab
global_characters_tab = """
              {activeTab === "global_characters" && (
                <div className="p-8 bg-slate-50 relative">
                  <div className="flex justify-between items-center mb-8">
                    <div>
                      <h3 className="font-bold text-lg text-slate-800 mb-1">
                        Global Characters
                      </h3>
                      <p className="text-sm text-slate-500">
                        Manage system-wide AI characters available to all users.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1">
                      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <h4 className="font-bold text-sm mb-4 uppercase text-slate-800">
                          Create New Character
                        </h4>
                        <form onSubmit={handleCreateGlobalCharacter} className="space-y-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Name</label>
                            <input type="text" value={newGlobalChar.name} onChange={e => setNewGlobalChar({...newGlobalChar, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-2 rounded text-sm text-slate-800" required />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Role Type</label>
                            <select value={newGlobalChar.role} onChange={e => setNewGlobalChar({...newGlobalChar, role: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-2 rounded text-sm text-slate-800">
                              <option value="Hero">Hero</option>
                              <option value="Villain">Villain</option>
                              <option value="Sidekick">Sidekick</option>
                              <option value="Mentor">Mentor</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Description</label>
                            <textarea value={newGlobalChar.desc} onChange={e => setNewGlobalChar({...newGlobalChar, desc: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-2 rounded text-sm text-slate-800" rows={3} />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Avatar Image URL</label>
                            <input type="text" value={newGlobalChar.image} onChange={e => setNewGlobalChar({...newGlobalChar, image: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-2 rounded text-sm text-slate-800" />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">AI Generation Prompt Base</label>
                            <textarea value={newGlobalChar.generationPrompt} onChange={e => setNewGlobalChar({...newGlobalChar, generationPrompt: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-2 rounded text-sm text-slate-800 font-mono" rows={3} />
                          </div>
                          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded transition-colors text-sm">
                            Add Character
                          </button>
                        </form>
                      </div>
                    </div>

                    <div className="lg:col-span-2">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {globalCharacters.map((char) => (
                          <div key={char.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex gap-4">
                            <div className="w-16 h-16 rounded-lg bg-slate-100 flex-shrink-0 overflow-hidden border border-slate-200">
                              {char.image_url ? (
                                <img src={char.image_url} alt={char.character_name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-300">No Img</div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-slate-800 truncate">{char.character_name}</h4>
                              <p className="text-[10px] uppercase font-bold text-blue-600 tracking-wider mb-1">{char.role_type}</p>
                              <p className="text-xs text-slate-500 line-clamp-2">{char.description}</p>
                            </div>
                          </div>
                        ))}
                        {globalCharacters.length === 0 && (
                          <div className="col-span-2 py-12 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                            No global characters have been created yet.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
"""

target_plans = "              {activeTab === \"plans\" && ("
content = content.replace(target_plans, global_characters_tab + "\n" + target_plans)

with open('AdminApp.tsx', 'w') as f:
    f.write(content)

print("AdminApp.tsx patched successfully!")
