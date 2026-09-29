const test=require('node:test');
const assert=require('node:assert/strict');
const M=require('../model.js');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
test('scale changes weight while keeping height and BMI arithmetic consistent',()=>{
 for(const height of [160,180,210])for(const bmi of [12,18.5,22.4,25,30,40]){
  const result=M.calculate(height,M.weightAtBmi(height,bmi));
  assert.equal(result.ok,true);assert.equal(result.height,height);assert.ok(Math.abs(result.bmi-bmi)<1e-10);
 }
});
test('scale respects form limits at extreme heights and targets',()=>{
 assert.equal(M.weightAtBmi(50,12),10);
 assert.equal(M.weightAtBmi(260,100),500);
 assert.throws(()=>M.weightAtBmi('',22));assert.throws(()=>M.weightAtBmi(300,22));assert.throws(()=>M.weightAtBmi(180,-1));
});
test('all seven dictionaries include interactive controls with matching keys',()=>{
 const context={window:{}};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../translations.js'),'utf8'),context);
 const dictionaries=context.window.BMITranslations;assert.equal(Object.keys(dictionaries).length,7);
 for(const dictionary of Object.values(dictionaries)){
  assert.deepEqual(Object.keys(dictionary).sort(),Object.keys(dictionaries.pl).sort());
  for(const key of ['live','scaleHint','scaleControl','simulation','restore','increase','decrease'])assert.ok(dictionary[key]);
 }
});
