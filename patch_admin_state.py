with open('AdminApp.tsx', 'r') as f:
    code = f.read()

# 1. Add useState for analyticsData
code = code.replace(
    'const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);',
    'const [analyticsData, setAnalyticsData] = useState<any>(null);\n  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);'
)

# 2. Add fetch logic in fetchData. Where is fetchData defined?
fetch_insert = """
    const analyticsRes = await adminFetch("/api/admin/cost-analytics");
    if (analyticsRes.ok) {
      setAnalyticsData(await analyticsRes.json());
    }
"""

# Let's insert it right after fetching health data.
code = code.replace(
    'setHealthData(systemData);',
    'setHealthData(systemData);\n' + fetch_insert
)

with open('AdminApp.tsx', 'w') as f:
    f.write(code)

print("AdminApp patched with analyticsData state and fetch")
