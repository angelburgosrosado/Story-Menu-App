# i18n QA Checklist — Task 7.11

## Supported Languages

| Code | Language | Status |
|---|---|---|
| `en` | English | ✅ Complete |
| `es` | Spanish | ✅ Complete |
| `ja` | Japanese | ✅ Complete |
| `pt-BR` | Portuguese (Brazil) | ✅ Complete |
| `fr` | French | ✅ Complete |
| `de` | German | ✅ Complete |
| `ko` | Korean | ✅ Complete |

## QA Checklist

### 1. Translation Completeness
- [ ] All UI strings translated for each language
- [ ] No hardcoded English strings in components
- [ ] Fallback to English for missing translations
- [ ] RTL support tested (if applicable)

### 2. Date & Time Formatting
- [ ] Dates display in locale format (MM/DD/YYYY vs DD/MM/YYYY)
- [ ] Time zones handled correctly
- [ ] Relative times ("2 hours ago") localized

### 3. Number Formatting
- [ ] Currency displays correctly ($9.99 vs 9,99 €)
- [ ] Number separators (1,000 vs 1.000)
- [ ] Decimal points localized

### 4. Text Layout
- [ ] Long German/French strings don't break UI
- [ ] CJK characters render correctly
- [ ] Line breaks appropriate for each language
- [ ] Text overflow handled with ellipsis

### 5. SEO & Meta Tags
- [ ] `<title>` translated for each locale
- [ ] `<meta description>` translated
- [ ] OpenGraph tags use correct language
- [ ] hreflang tags correct in HTML

### 6. User-Generated Content
- [ ] Genre names display in correct language
- [ ] Format names localized
- [ ] Error messages translated
- [ ] Success messages translated

### 7. API Responses
- [ ] Error messages from backend localized
- [ ] Validation messages translated
- [ ] Email templates in correct language

### 8. Accessibility
- [ ] Screen reader text localized
- [ ] ARIA labels translated
- [ ] Keyboard shortcuts documented per locale

## Testing Commands

```bash
# Check for hardcoded English strings
grep -rn "['\"]English text['\"]" --include="*.tsx" --include="*.ts" .

# Check translation coverage
for lang in en es ja pt fr de ko; do
    echo "=== $lang ==="
    grep -c "t('" i18n/$lang.json 2>/dev/null || echo "File missing"
done

# Test locale switching
curl -H "Accept-Language: ja" https://storymenu.app/
# Should return Japanese content
```

## Common Issues

| Issue | Fix |
|---|---|
| Text overflow in German | Use `text-ellipsis` or increase container width |
| CJK line breaks | Add `word-break: break-all` for CJK text |
| Missing translation | Add key to all locale files, not just one |
| Date format mismatch | Use `Intl.DateTimeFormat` instead of manual formatting |
