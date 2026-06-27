import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, 'src', 'App.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// The section starts at: {/* 3. LEAVES VIEW */}
// Let's find the exact blocks.

const leavesViewStart = content.indexOf("{/* 3. LEAVES VIEW */}");
if (leavesViewStart === -1) {
  console.error("Leaves view not found");
  process.exit(1);
}

// We want to replace everything inside the activeTab === 'leaves' block.
// Let's extract the "Pending Leaves" block and the "Leaves Tracking Records" block, and reassemble.

const pendingStartStr = `{/* Right: Leaves Pending Approval (Manager / Admin view) or History (Employee view) */}`;
const pendingStart = content.indexOf(pendingStartStr);
const pendingEndStr = `                  </div>\n                </div>`;
const pendingEnd = content.indexOf(pendingEndStr, pendingStart) + pendingEndStr.length;
let pendingBlock = content.substring(pendingStart, pendingEnd);

// modify pending block to be a grid
pendingBlock = pendingBlock.replace('className="space-y-4"', 'className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4"');
pendingBlock = pendingBlock.replace('slice(0, 4)', 'slice(0, 4)'); // keep max 4
// remove the right column comment
pendingBlock = pendingBlock.replace(pendingStartStr, '{/* Top Section: Pending Leave Requests Widget */}');
// change title slightly
pendingBlock = pendingBlock.replace("? 'Pending Leave Requests' : 'Your Leave Requests'", "? 'Pending Approvals (Action Required)' : 'Recent Leave Updates'");


// remove pending block from its current place
content = content.substring(0, pendingStart) + content.substring(pendingEnd);

// now find the start of the grid: <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
const gridStartStr = `<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">`;
const gridStart = content.indexOf(gridStartStr, leavesViewStart);

// insert the pending block before the gridStart, wrapped in a space-y-8 div if needed, but activeTab === 'leaves' already has a div.
// Wait, let's see what activeTab === 'leaves' has:
/*
          {activeTab === 'leaves' && (
            <div className="space-y-6"> // wait, is it space-y-6 or not?
*/
// The user's code previously:
// {activeTab === 'leaves' && (
//   <div className="space-y-6">
//     <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
// Let's just insert it right after `<div className="space-y-6">` (or similar) inside the leaves view.
const leavesContainerStr = `{activeTab === 'leaves' && (\n            <div>\n              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">`;
// Wait, my view_file showed:
/*
986:           {/* 3. LEAVES VIEW *}
987:           {activeTab === 'leaves' && (
988:             <div>
989:               <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
*/
const insertPoint = content.indexOf(gridStartStr, leavesViewStart);

content = content.substring(0, insertPoint) + 
          pendingBlock + '\n\n              ' +
          content.substring(insertPoint);

// Clean up: The pending block was originally inside `<div className="lg:col-span-2 space-y-6">`
// So we need to make sure the right column for "Leave Tracking Records" doesn't have an empty space-y-6 that looks bad.
// The left column is lg:col-span-1, the right is lg:col-span-2.
// Let's also make sure the padding is good.
content = content.replace(
  '{activeTab === \'leaves\' && (\n            <div>',
  '{activeTab === \'leaves\' && (\n            <div className="space-y-8">'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Layout restructured successfully!');
