with open('Setup.tsx', 'r') as f:
    content = f.read()

start_marker = "{(!isCyberpunk && activeTab === 'library') && ("
end_marker = "        {(activeTab === 'vault') && ("

idx_start = content.find(start_marker)
idx_end = content.find(end_marker)

if idx_start != -1 and idx_end != -1:
    replacement = """{(!isCyberpunk && activeTab === 'library') && (
            <WorkspaceLibrary 
                isEditorial={isEditorial}
                isCyberpunk={isCyberpunk}
                savedProjects={savedProjects}
                handleDeleteProject={handleDeleteProject}
                manualComicTitle={manualComicTitle}
                setManualComicTitle={setManualComicTitle}
                manualComicGenre={manualComicGenre}
                setManualComicGenre={setManualComicGenre}
                manualComicLanguage={manualComicLanguage}
                setManualComicLanguage={setManualComicLanguage}
                dynamicCategories={dynamicCategories}
                manualComicCover={manualComicCover}
                setManualComicCover={setManualComicCover}
                isPublishingManual={isPublishingManual}
                handleManualPublish={handleManualPublish}
                savedDrafts={savedDrafts}
                isSavingDraft={isSavingDraft}
                handleSaveDraft={handleSaveDraft}
                handleDeleteDraft={handleDeleteDraft}
                onLoadProject={props.onLoadProject}
                onLoadDraft={props.onLoadDraft}
                sPrimaryBtn={sPrimaryBtn}
                sLabel={sLabel}
                sInput={sInput}
                sSelect={sSelect}
            />
        )}

"""
    new_content = content[:idx_start] + replacement + content[idx_end:]
    
    if "import { WorkspaceLibrary }" not in new_content:
        new_content = new_content.replace("import { WorkspaceSidebar } from './WorkspaceSidebar';", "import { WorkspaceSidebar } from './WorkspaceSidebar';\nimport { WorkspaceLibrary } from './WorkspaceLibrary';")
        
    with open('Setup.tsx', 'w') as f:
        f.write(new_content)
    print("Patched successfully")
else:
    print("Could not find markers")
