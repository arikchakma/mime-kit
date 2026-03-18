export const STATE = {
  TEXT: 'Text',
  TAG_OPEN: 'TagOpen',
  TAG_NAME: 'TagName',
  BEFORE_ATTR_NAME: 'BeforeAttrName',
  ATTR_NAME: 'AttrName',
  AFTER_ATTR_NAME: 'AfterAttrName',
  BEFORE_ATTR_VALUE: 'BeforeAttrValue',
  ATTR_VALUE_DOUBLE_QUOTED: 'AttrValueDoubleQuoted',
  ATTR_VALUE_SINGLE_QUOTED: 'AttrValueSingleQuoted',
  ATTR_VALUE_UNQUOTED: 'AttrValueUnquoted',
  SELF_CLOSING: 'SelfClosing',
  CLOSE_TAG_NAME: 'CloseTagName',
} as const;

export type State = (typeof STATE)[keyof typeof STATE];
