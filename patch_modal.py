import re

with open('AdminApp.tsx', 'r') as f:
    code = f.read()

# 1. Fix modal positioning
old_modal = r'\{showPlanModal && \(\n\s*<div className="absolute top-0 left-0 w-full h-full bg-slate-900/50 z-10 flex items-center justify-center p-4">'
new_modal = '{showPlanModal && (\n                                <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">'
code = re.sub(old_modal, new_modal, code)

# 2. Add empty state for features
old_features_ui = r'\{settings\.filter\(\(s:any\) => s\.keyName && s\.keyName\.startsWith\(\'feature_\'\)\)\.map\(\(s:any\) => s\.keyName\)\.map\(\(feature: string\) => \('
new_features_ui = """{settings.filter((s:any) => s.keyName && s.keyName.startsWith('feature_')).length === 0 ? (
                                                <div className="p-4 text-sm text-slate-500 text-center border border-dashed border-slate-300 rounded-lg">
                                                    No UI Feature Flags have been created yet.<br/>
                                                    <span className="text-xs">Go to the <strong>UI Feature Flags</strong> tab to create globally manageable features!</span>
                                                </div>
                                            ) : settings.filter((s:any) => s.keyName && s.keyName.startsWith('feature_')).map((s:any) => s.keyName).map((feature: string) => ("""
code = code.replace(old_features_ui, new_features_ui)

with open('AdminApp.tsx', 'w') as f:
    f.write(code)

print("Modal patched")
