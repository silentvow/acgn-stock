'use strict';
import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

//議題資料集
export const dbRuleIssues = new Mongo.Collection('ruleIssues');
export default dbRuleIssues;

//schema
const schema = new SimpleSchema({
  //議題標題
  title: {
    type: String,
    min: 1
  },
  //議題列表
  options: {
    type: Array,
  },
  'options.$': {
    type: String
  }
});
dbRuleIssues.attachSchema(schema);

