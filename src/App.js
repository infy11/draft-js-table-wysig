import React from 'react';
import './App.css';
//import { Editor } from 'react-draft-wysiwyg';
import {Editor, EditorState, NestedUtils, RichUtils, convertFromRaw,convertToRaw, Modifier, genKey, ContentBlock, ContentState, EditorBlock, genNestedKey} from 'draft-js';
import 'draft-js/dist/Draft.css';
import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";
import * as table from 'draft-js-table';

import { List } from 'immutable';
const blockRenderMap = table.DefaultBlockRenderMap;

const extendedBlockRenderMap = NestedUtils.DefaultBlockRenderMap.merge(blockRenderMap);

const BLOCK_TYPES = [
  {label: 'H1', style: 'header-one'},
  {label: 'H2', style: 'header-two'},
  {label: 'H3', style: 'header-three'},
  {label: 'H4', style: 'header-four'},
  {label: 'H5', style: 'header-five'},
  {label: 'H6', style: 'header-six'},
  {label: 'Blockquote', style: 'blockquote'},
  {label: 'UL', style: 'unordered-list-item'},
  {label: 'OL', style: 'ordered-list-item'},
  {label: 'Code Block', style: 'code-block'},
];

class StyleButton extends React.Component {
  constructor() {
      super();
      this.onToggle = (e) => {
          e.preventDefault();
          this.props.onToggle(this.props.style);
      };
  }

  render() {
      let className = 'RichEditor-styleButton';
      if (this.props.active) {
          className += ' RichEditor-activeButton';
      }

      return (
          <span className={className} onMouseDown={this.onToggle}>
              {this.props.label}
          </span>
      );
  }
}

const BlockStyleControls = (props) => {
  const {editorState} = props;
  const selection = editorState.getSelection();
  const blockType = editorState
      .getCurrentContent()
      .getBlockForKey(selection.getStartKey())
      .getType();

  function onInsertTable(e) {
      e.preventDefault();
      props.onChange(
          table.insertTable(editorState)
      );
  }

  return (
      <div className="RichEditor-controls">
          {BLOCK_TYPES.map((type) =>
              <StyleButton
                  key={type.label}
                  active={type.style === blockType}
                  label={type.label}
                  onToggle={props.onToggle}
                  style={type.style}
              />
          )}
          <span className={'RichEditor-styleButton'} onMouseDown={onInsertTable}>Insert Table</span>
      </div>
  );
};

const TableComponent = props => {
  console.log(props);
  // const { block, contentState, blockProps } = props;
  // const data = contentState.getEntity(block.getEntityAt(0)).getData();

  // const { rows, columns } = data;

  // console.log(props, data, blockProps);
  // console.log(block, block.getText());
  
  // let newEditorState = addEmptyBlock(blockProps.editorState);
  // console.log(newEditorState);

  // const onChange = () => {
  //   console.log("I m in block onchange");
  // }

  return (
    <div className="tableComponentWrapper">
      <EditorBlock {...props} />
    </div>
  );
};


class TableControls extends React.Component {
  constructor(props) {
      super(props);

      this.onInsertRow = this._onInsertRow.bind(this);
      this.onInsertColumn = this._onInsertColumn.bind(this);
  }

  _onInsertRow(e) {
      e.preventDefault();
      this.props.onChange(
          table.insertRow(this.props.editorState)
      );
  }

  _onInsertColumn(e) {
      e.preventDefault();
      this.props.onChange(
          table.insertColumn(this.props.editorState)
      );
  }

  render() {
      return (
              <div className="RichEditor-controls">
                  <span className={'RichEditor-styleButton'} onMouseDown={this.onInsertRow}>Insert Row</span>
                  <span className={'RichEditor-styleButton'} onMouseDown={this.onInsertColumn}>Insert Column</span>
              </div>
          );
  }
};

function getBlockStyle(block) {
  return 'RichEditor-' + block.getType();
}

// Custom overrides for "code" style.
const styleMap = {
  CODE: {
      backgroundColor: 'rgba(0, 0, 0, 0.05)',
      fontFamily: '"Inconsolata", "Menlo", "Consolas", monospace',
      fontSize: 16,
      padding: 2,
  },
};


class App extends React.Component {
  constructor(props) {
    super(props);

    var contentState = convertFromRaw({
      entityMap: {},
      blocks: [
          // {
          //     type: 'header-one',
          //     text: 'Demo for editing table in DraftJS'
          // },
          {
              type: 'unstyled',
              // text: 'Insert a table here using the button in the toolbar.'
              text: ''
          }
      ]
  }, blockRenderMap);

    this.editorRef = React.createRef();

    this.state = {
      editorState: EditorState.createWithContent(contentState),
    };
    // this.focus = () => this.refs.editor.focus();
   // this.focus = () => this.editorRef.current.focusEditor();
    // this.onChange = (editorState) => this.setState({editorState});
    this.onUpArrow = (e) => this._onUpArrow(e);
    this.onDownArrow = (e) => this._onDownArrow(e);

    // this.handleKeyCommand = (command) => this._handleKeyCommand(command);
    this.toggleBlockType = (type) => this._toggleBlockType(type);
    this.toggleInlineStyle = (style) => this._toggleInlineStyle(style);

    console.log('draft js table', NestedUtils);
  }

  onInsertTable = () => {
    const {editorState} = this.state;
    const tableState = table.insertTable(editorState);

    this.setState({
      editorState:tableState
    })


  }

  onChange = (editorState) => {
    let isTable = table.hasSelectionInTable(editorState);
    console.log(isTable);
    const selection = editorState.getSelection();
    const blockType = editorState
      .getCurrentContent()
      .getBlockForKey(selection.getStartKey())
      .getType();
    console.log(blockType);
    if(isTable){
      const block = this.getSelectedBlock(editorState);
      console.log('selected block',block);
      console.log('raw current content',convertToRaw(editorState.getCurrentContent()))
      let currentContent = editorState.getCurrentContent();
      console.log('current content to object',currentContent.toObject());
      console.log(currentContent.getBlockMap());
      if(blockType === "unordered-list-item" || blockType === "ordered-list-item"){
        // let newEditorState = NestedUtils.toggleBlockType(editorState, "unordered-list-item")
        // let newEditorState = NestedUtils.onSplitNestedBlock(editorState)
        // console.log(newEditorState);
        let cellKey = block.getKey();
        console.log('cell key',cellKey);
        // this.insert_new_block('before', editorState);
        //let newEditorState = this.addEmptyBlock(editorState, cellKey)
        // // console.log(newEditorState);
        let newEditorState = this.insert_new_block('before', editorState, cellKey);
        this.setState({editorState: editorState})
      }else{
        this.setState({editorState});
      }
    }
  }

  insert_new_block = (direction, editorState, listkey) => {
    console.log('insert new block called');
    const selection = editorState.getSelection();
    const contentState = editorState.getCurrentContent();
    const currentBlock = contentState.getBlockForKey(selection.getEndKey());
    const blockMap = contentState.getBlockMap()
    console.log(blockMap.toObject())
    // Split the blocks
    const blocksBefore = blockMap.toSeq().takeUntil(function (v) {
        return v === currentBlock
    })
    const blocksAfter = blockMap.toSeq().skipUntil(function (v) {
        return v === currentBlock
    }).rest()
    const newBlockKey = genNestedKey(listkey);
    let newBlocks = direction === 'before' ? [
        [newBlockKey, new ContentBlock({
          key: newBlockKey,
          type: 'unordered-list-item'
        })],
        [currentBlock.getKey(), currentBlock],
    ] : [
        [currentBlock.getKey(), currentBlock],
        [newBlockKey, new ContentBlock({
          key: newBlockKey,
          type: 'unordered-list-item',
          text: '',
          characterList: List(),
        })],
    ];
    const newBlockMap = blocksBefore.concat(newBlocks, blocksAfter).toOrderedMap()
    const newContentState = contentState.merge({ 
        blockMap: newBlockMap,
        selectionBefore: selection,
        selectionAfter: selection,
    })
    let newEditorState =  EditorState.push(editorState, newContentState, 'insert-table-cell');
    this.setState({
      editorState: newEditorState
    })
    return newEditorState;
  }

  addEmptyBlock(editorState, listkey) {
    const newBlock = new ContentBlock({
        key: `${listkey}/${genKey()}`,
        type: 'table-cell',
        text: '',
        characterList: List(),
    });
    

    const contentState = editorState.getCurrentContent();
    const currentBlockMap = this.getSelectedBlock(editorState);
    console.log('current block map', currentBlockMap.toObject());
    const newBlockMap = contentState.getBlockMap().set(newBlock.key, newBlock);
    console.log('editor state and content state', contentState.getBlockMap().toObject(), newBlockMap.toObject());
  
    const editorWithBlock = EditorState.push(
        editorState,
        contentState.merge({blockMap: newBlockMap})
    );
    return editorWithBlock
}


  handleKeyCommand= (command) => {
    console.log(command);
    const {editorState} = this.state
    const selection = editorState.getSelection();
    const blockType = editorState
      .getCurrentContent()
      .getBlockForKey(selection.getStartKey())
      .getType();
    let newState;
    // var newState = (table.handleKeyCommand(editorState, command)
    //     || RichUtils.handleKeyCommand(editorState, command));
    console.log(blockType);
    if(command==='split-block' && blockType==='table-cell'){
      newState = RichUtils.insertSoftNewline(editorState)
    }
    if(command==='backspace'){
      console.log("backspace is pressed");
      const block = this.getSelectedBlock(editorState);//get selected block
      if(this.isEmptyBlock(block)){
        console.log("Block is empty")
        return null
      }
    }
    

    if (newState) {
        this.onChange(newState);
        return true;
    }
    return false;
  }

  handleReturn = (e) => {
    console.log("I am in handleReturn")
  }

  isEmptyBlock = (block) => {
    const text = block.getText();
    const hasEmptyText = text.length === 0;
    return hasEmptyText;
  }

  getSelectedBlock = (editorState) => {
    const selection = editorState.getSelection();
    const contentState = editorState.getCurrentContent();
    const blockStartKey = selection.getStartKey();
    
    return contentState.getBlockMap().get(blockStartKey);
  }

blockRenderer = contentBlock => {
  const { editorState } = this.state;

    const type = contentBlock.getType();
    console.log(contentBlock, type)
    if (type === "unordered-list-item") {
      return {
        component: TableComponent,
        editable: true,
        props: {
          foo: "bar",
          editorState: editorState
        }
      };
    }
    
  };

  render() {

    const { editorState } = this.state;
    const block = this.getSelectedBlock(editorState);
    const blockKey = block.getKey()

    // If the user changes block type before entering any text, we can
    // either style the placeholder or hide it. Let's just hide it now.
    let className = 'RichEditor-editor';
    var contentState = editorState.getCurrentContent();
    if (!contentState.hasText()) {
        if (contentState.getBlockMap().first().getType() !== 'unstyled') {
            className += ' RichEditor-hidePlaceholder';
        }
    }

    let isTable = table.hasSelectionInTable(editorState);

    return (
      <div className="RichEditor-root">
        {/* {isTable? <TableControls
            editorState={editorState}
            onChange={this.onChange}
        /> : <BlockStyleControls
            editorState={editorState}
            onToggle={this.toggleBlockType}
            onChange={this.onChange}
        />} */}
        <TableControls
            editorState={editorState}
            onChange={this.onChange}
        />
        <BlockStyleControls
            editorState={editorState}
            onToggle={this.toggleBlockType}
            onChange={this.onChange}
        />
        <div className={className} onClick={this.focus}>
          <Editor 
            editorState={this.state.editorState} 
            blockRenderMap={extendedBlockRenderMap} 
            customStyleMap={styleMap}
            onChange={this.onChange} 
            handleKeyCommand={this.handleKeyCommand}
            handleReturn={this.handleReturn}
            ref={this.editorRef}
            blockStyleFn={getBlockStyle}
            // blockRendererFn={this.blockRenderer}
          />
        </div>
        <button onClick={()=> {this.insert_new_block('before', editorState, blockKey)}}>insert new block</button>
      </div>
    );
  }
}

export default App;
