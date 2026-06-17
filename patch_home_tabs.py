import re

with open('Home.tsx', 'r') as f:
    content = f.read()

target = """                        {/* Right Column: Interactive Simulator */}
                        <div className="lg:col-span-5">
                            <div className={`rounded-3xl p-6 border shadow-2xl relative transition-all ${"""

replacement = """                        {/* Right Column: Interactive Simulator */}
                        <div className="lg:col-span-5">
                            {/* Mode Switcher */}
                            <div className={`flex gap-2 mb-6 p-2 rounded-2xl border ${isLightMode ? 'bg-white border-slate-200' : 'bg-white/5 border-white/10'}`}>
                                <button 
                                    onClick={() => setSandboxMode('arena')}
                                    className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${sandboxMode === 'arena' ? 'bg-indigo-600 text-white' : (isLightMode ? 'text-slate-500 hover:bg-slate-100' : 'text-gray-400 hover:bg-white/10')}`}
                                >
                                    Arena Sandbox
                                </button>
                                <button 
                                    onClick={() => setSandboxMode('character')}
                                    className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${sandboxMode === 'character' ? 'bg-purple-600 text-white' : (isLightMode ? 'text-slate-500 hover:bg-slate-100' : 'text-gray-400 hover:bg-white/10')}`}
                                >
                                    Character Vault
                                </button>
                                <button 
                                    onClick={() => setSandboxMode('kids')}
                                    className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${sandboxMode === 'kids' ? 'bg-orange-500 text-white' : (isLightMode ? 'text-slate-500 hover:bg-slate-100' : 'text-gray-400 hover:bg-white/10')}`}
                                >
                                    Kids Story
                                </button>
                            </div>

                            {sandboxMode === 'character' && <CharacterCreator isLightMode={isLightMode} />}
                            {sandboxMode === 'kids' && <KidsStoryCreator isLightMode={isLightMode} />}
                            {sandboxMode === 'arena' && (
                            <div className={`rounded-3xl p-6 border shadow-2xl relative transition-all ${"""

content = content.replace(target, replacement)

target2 = """                                                        <button className={`text-[10px] hover:underline flex items-center gap-1 ${isLightMode ? 'text-slate-500' : 'text-gray-400'}`}>
                                                            <RotateCw className="w-3 h-3" /> {t('home.auto21', 'Regenerate Node')}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>"""

replacement2 = """                                                        <button className={`text-[10px] hover:underline flex items-center gap-1 ${isLightMode ? 'text-slate-500' : 'text-gray-400'}`}>
                                                            <RotateCw className="w-3 h-3" /> {t('home.auto21', 'Regenerate Node')}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>"""

content = content.replace(target2, replacement2)

with open('Home.tsx', 'w') as f:
    f.write(content)

print("Patched Home.tsx successfully!")
