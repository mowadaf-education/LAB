const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'pages', 'Chemicals.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

const regex = /{isReviewModalOpen[\s\S]*?<\/AnimatePresence>/;
const replacement = `{/* Review Update Modal */}
      <ChemicalReviewModal
        isOpen={isReviewModalOpen}
        suggestedUpdate={suggestedUpdate}
        selectedChemical={selectedChemical}
        onClose={() => setIsReviewModalOpen(false)}
        onApprove={handleApproveUpdate}
      />`;

content = content.replace(regex, replacement);

if (!content.includes('ChemicalReviewModal')) {
    content = content.replace("import { ChemicalAddModal } from '../components/ChemicalAddModal';", "import { ChemicalAddModal } from '../components/ChemicalAddModal';\nimport { ChemicalReviewModal } from '../components/ChemicalReviewModal';");
}


fs.writeFileSync(filePath, content);
console.log('Successfully replaced ChemicalReviewModal block in Chemicals.tsx');
