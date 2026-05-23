const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'pages', 'Chemicals.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

const regex = /{isBulkConfirmOpen[\s\S]*?<\/AnimatePresence>/;
const replacement = `{/* Bulk Update Confirmation Modal */}
      <ChemicalBulkConfirmModal
        isOpen={isBulkConfirmOpen}
        chemicalsLength={chemicals.length}
        onClose={() => setIsBulkConfirmOpen(false)}
        onConfirm={handleBulkSmartUpdate}
      />`;

content = content.replace(regex, replacement);

if (!content.includes('ChemicalBulkConfirmModal')) {
    content = content.replace("import { ChemicalReviewModal } from '../components/ChemicalReviewModal';", "import { ChemicalReviewModal } from '../components/ChemicalReviewModal';\nimport { ChemicalBulkConfirmModal } from '../components/ChemicalBulkConfirmModal';");
}

fs.writeFileSync(filePath, content);
console.log('Successfully replaced ChemicalBulkConfirmModal block in Chemicals.tsx');
