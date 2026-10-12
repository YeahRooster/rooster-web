const fs = require('fs');

let code = fs.readFileSync('app.js', 'utf8');

const oldFetchLogicRegex = /let angleTerms = '';[\s\S]*?const fullQuery = customQuery \? `\$\{customQuery\} \$\{angleTerms\}` : angleTerms;/;

const newFetchLogic = `const currentModel = modelSelector ? modelSelector.value : 'skull';
  let subjectTerms = 'face portrait';
  if (currentModel === 'human_body') subjectTerms = 'human figure full body pose';
  else if (currentModel === 'animal_body') subjectTerms = 'animal full body standing';
  else if (currentModel === 'dog_skull') subjectTerms = 'animal head portrait';
  else if (currentModel === 'hand') subjectTerms = 'human hand reference';

  let angleTerms = '';
  const absYaw = Math.abs(state.yaw);
  const isRight = state.yaw > 0;

  if (absYaw <= 18) {
    angleTerms = \`\${subjectTerms} front frontal\`;
  } else if (absYaw > 18 && absYaw <= 65) {
    angleTerms = \`\${subjectTerms} three-quarter \${isRight ? 'right' : 'left'}\`;
  } else if (absYaw > 65 && absYaw <= 120) {
    angleTerms = \`\${subjectTerms} side profile \${isRight ? 'right' : 'left'}\`;
  } else if (absYaw > 120 && absYaw < 165) {
    angleTerms = \`\${subjectTerms} back view three-quarter\`;
  } else {
    angleTerms = \`\${subjectTerms} back view rear\`;
  }

  if (state.pitch < -18) {
    angleTerms += ' low angle';
  } else if (state.pitch > 18) {
    angleTerms += ' high angle';
  }

  const fullQuery = customQuery ? \`\${customQuery} \${angleTerms}\` : angleTerms;`;

code = code.replace(oldFetchLogicRegex, newFetchLogic);

fs.writeFileSync('app.js', code);
console.log('Successfully updated Wikimedia dynamic query builder!');
