import React, { useState, useMemo, useCallback } from 'react';
import { addressParser } from 'postal-mime';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import styles from './styles.module.css';

const DEFAULT_MESSAGE = {
  from: '"Sender Name" <sender@example.com>',
  to: 'recipient@example.com',
  cc: 'cc@example.com',
  subject: 'Hello from Nodemailer!',
  html: '<h1>Hello!</h1>\n<p>This is an <strong>HTML</strong> message with an embedded image:</p>\n<p><img src="cid:logo@example" alt="Logo" style="width: 16px; height: 16px;"></p>\n<p>Edit the JSON on the left to see the preview update in real-time.</p>',
  attachments: [
    {
      filename: 'logo.png',
      content: 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAUUlEQVR42sWTwQ4AMARD6f//s103MdOQzNUrtXQizdJbw0TMgVoa4IWB4NCAEUcMGHHEovuIYLd7FzMO/g/QJFCvPMydwLjYWVTynjHtz9SuBVmmEhqhGKQyAAAAAElFTkSuQmCC',
      encoding: 'base64',
      cid: 'logo@example',
      contentType: 'image/png'
    },
    {
      filename: 'document.pdf',
      content: 'JVBERi0xLjEKMSAwIG9iago8PCAvVHlwZSAvQ2F0YWxvZyAvUGFnZXMgMiAwIFIgPj4KZW5kb2JqCjIgMCBvYmoKPDwgL1R5cGUgL1BhZ2VzIC9LaWRzIFszIDAgUl0gL0NvdW50IDEgPj4KZW5kb2JqCjMgMCBvYmoKPDwgL1R5cGUgL1BhZ2UgL1BhcmVudCAyIDAgUiAvTWVkaWFCb3ggWzAgMCA1OTUgODQyXSAvQ29udGVudHMgNCAwIFIgL1Jlc291cmNlcyA8PCAvRm9udCA8PCAvRjEgNSAwIFIgPj4gPj4gPj4KZW5kb2JqCjQgMCBvYmoKPDwgL0xlbmd0aCA1MSA+PgpzdHJlYW0KQlQgL0YxIDEyIFRmIDI2Ni4xNSA0MjEgVGQgKE5vZGVtYWlsZXIpIFRqIEVUCmVuZHN0cmVhbQplbmRvYmoKNSAwIG9iago8PCAvVHlwZSAvRm9udCAvU3VidHlwZSAvVHlwZTEgL0Jhc2VGb250IC9IZWx2ZXRpY2EgPj4KZW5kb2JqCnhyZWYKMCA2CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDAwOSAwMDAwMCBuIAowMDAwMDAwMDU4IDAwMDAwIG4gCjAwMDAwMDAxMTUgMDAwMDAgbiAKMDAwMDAwMDI1MyAwMDAwMCBuIAowMDAwMDAwMzgxIDAwMDAwIG4gCnRyYWlsZXIKPDwgL1NpemUgNiAvUm9vdCAxIDAgUiA+PgpzdGFydHhyZWYKNDU0CiUlRU9GCg==',
      encoding: 'base64',
      contentType: 'application/pdf'
    }
  ]
};

/**
 * Validate a single address value.
 * Returns null if valid, error message if invalid.
 */
function validateAddress(value, fieldName) {
  if (value === undefined || value === null) return null;

  if (typeof value === 'string') return null;

  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      const item = value[i];
      if (typeof item === 'string') continue;
      if (item && typeof item === 'object') {
        if (typeof item.address !== 'string') {
          return `${fieldName}[${i}]: object must have 'address' as string`;
        }
        if (item.name !== undefined && typeof item.name !== 'string') {
          return `${fieldName}[${i}]: 'name' must be a string`;
        }
        continue;
      }
      return `${fieldName}[${i}]: must be string or object with 'address'`;
    }
    return null;
  }

  if (typeof value === 'object') {
    if (typeof value.address !== 'string') {
      return `${fieldName}: object must have 'address' as string`;
    }
    if (value.name !== undefined && typeof value.name !== 'string') {
      return `${fieldName}: 'name' must be a string`;
    }
    return null;
  }

  return `${fieldName}: must be string, array, or object with 'address'`;
}

// All valid Nodemailer attachment keys
const VALID_ATTACHMENT_KEYS = new Set([
  'filename', 'content', 'path', 'href',
  'contentType', 'contentDisposition', 'contentTransferEncoding',
  'cid', 'encoding', 'headers', 'raw'
]);

/**
 * Validate attachment object.
 * Returns null if valid, error message if invalid.
 */
function validateAttachment(att, index) {
  if (!att || typeof att !== 'object' || Array.isArray(att)) {
    return `attachments[${index}]: must be an object`;
  }

  // Check for unknown keys
  const unknownKeys = Object.keys(att).filter(key => !VALID_ATTACHMENT_KEYS.has(key));
  if (unknownKeys.length > 0) {
    return `attachments[${index}]: unknown field${unknownKeys.length > 1 ? 's' : ''}: ${unknownKeys.join(', ')}`;
  }

  if (att.content !== undefined && typeof att.content !== 'string') {
    return `attachments[${index}].content: must be a string (base64 encoded)`;
  }

  if (att.filename !== undefined && typeof att.filename !== 'string') {
    return `attachments[${index}].filename: must be a string`;
  }

  if (att.encoding !== undefined && att.encoding !== 'base64') {
    return `attachments[${index}].encoding: must be 'base64'`;
  }

  if (att.contentType !== undefined && typeof att.contentType !== 'string') {
    return `attachments[${index}].contentType: must be a string`;
  }

  if (att.cid !== undefined && typeof att.cid !== 'string') {
    return `attachments[${index}].cid: must be a string`;
  }

  if (att.contentDisposition !== undefined &&
      att.contentDisposition !== 'inline' &&
      att.contentDisposition !== 'attachment') {
    return `attachments[${index}].contentDisposition: must be 'inline' or 'attachment'`;
  }

  return null;
}

// All valid Nodemailer message configuration keys
const VALID_MESSAGE_KEYS = new Set([
  // Common fields
  'from', 'to', 'cc', 'bcc', 'subject', 'text', 'html', 'attachments',
  // Routing options
  'sender', 'replyTo', 'inReplyTo', 'references', 'envelope',
  // Content options
  'attachDataUrls', 'watchHtml', 'amp', 'icalEvent', 'alternatives',
  'encoding', 'raw', 'textEncoding',
  // Header options
  'priority', 'headers', 'messageId', 'date', 'list',
  // Security options
  'disableFileAccess', 'disableUrlAccess',
  // Advanced options
  'normalizeHeaderKey', 'boundaryPrefix', 'baseBoundary', 'newline', 'xMailer'
]);

/**
 * Validate message configuration object.
 * Returns null if valid, error message if invalid.
 */
function validateMessage(message) {
  if (!message || typeof message !== 'object' || Array.isArray(message)) {
    return 'Message must be an object';
  }

  // Check for unknown keys
  const unknownKeys = Object.keys(message).filter(key => !VALID_MESSAGE_KEYS.has(key));
  if (unknownKeys.length > 0) {
    return `Unknown field${unknownKeys.length > 1 ? 's' : ''}: ${unknownKeys.join(', ')}`;
  }

  // Validate address fields
  const addressFields = ['from', 'to', 'cc', 'bcc', 'replyTo', 'sender'];
  for (const field of addressFields) {
    const error = validateAddress(message[field], field);
    if (error) return error;
  }

  // Validate string fields
  const stringFields = ['subject', 'text', 'html', 'messageId', 'inReplyTo', 'amp', 'watchHtml'];
  for (const field of stringFields) {
    if (message[field] !== undefined && typeof message[field] !== 'string') {
      return `${field}: must be a string`;
    }
  }

  // Validate attachments array
  if (message.attachments !== undefined) {
    if (!Array.isArray(message.attachments)) {
      return 'attachments: must be an array';
    }
    for (let i = 0; i < message.attachments.length; i++) {
      const error = validateAttachment(message.attachments[i], i);
      if (error) return error;
    }
  }

  // Validate alternatives array
  if (message.alternatives !== undefined) {
    if (!Array.isArray(message.alternatives)) {
      return 'alternatives: must be an array';
    }
  }

  // Validate headers if present
  if (message.headers !== undefined) {
    if (typeof message.headers !== 'object' || Array.isArray(message.headers)) {
      return 'headers: must be an object';
    }
  }

  // Validate priority if present
  if (message.priority !== undefined) {
    if (!['high', 'normal', 'low'].includes(message.priority)) {
      return "priority: must be 'high', 'normal', or 'low'";
    }
  }

  // Validate boolean fields
  const booleanFields = ['attachDataUrls', 'disableFileAccess', 'disableUrlAccess'];
  for (const field of booleanFields) {
    if (message[field] !== undefined && typeof message[field] !== 'boolean') {
      return `${field}: must be a boolean`;
    }
  }

  return null;
}

/**
 * Parse email addresses using postal-mime's addressParser.
 * Handles strings, objects with name/address, and arrays.
 * Returns a flat array of { name, address } objects.
 */
function parseAddressList(addresses) {
  if (!addresses) return [];

  try {
    // Handle array of addresses
    if (Array.isArray(addresses)) {
      const results = [];
      for (const addr of addresses) {
        if (typeof addr === 'string') {
          // Parse string addresses
          const parsed = addressParser(addr, { flatten: true });
          results.push(...parsed);
        } else if (addr && typeof addr === 'object' && addr.address) {
          // Object format { name, address }
          results.push({
            name: addr.name || '',
            address: addr.address,
          });
        }
      }
      return results;
    }

    // Handle object format { name, address }
    if (typeof addresses === 'object' && addresses.address) {
      return [{
        name: addresses.name || '',
        address: addresses.address,
      }];
    }

    // Handle string (single address or comma-separated)
    if (typeof addresses === 'string') {
      return addressParser(addresses, { flatten: true });
    }
  } catch (e) {
    console.warn('Failed to parse addresses:', e);
  }

  return [];
}

function textToHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>')
    .replace(/  /g, '&nbsp; ');
}

function isBase64(str) {
  if (!str || typeof str !== 'string') return false;
  // Check if it looks like base64 (only valid base64 chars)
  const base64Regex = /^[A-Za-z0-9+/=]+$/;
  return base64Regex.test(str.replace(/\s/g, ''));
}

function getContentType(attachment) {
  if (attachment.contentType) return attachment.contentType;

  const filename = attachment.filename || '';
  const ext = filename.split('.').pop()?.toLowerCase();

  const mimeTypes = {
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'svg': 'image/svg+xml',
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'txt': 'text/plain',
    'html': 'text/html',
    'css': 'text/css',
    'js': 'application/javascript',
    'json': 'application/json',
    'xml': 'application/xml',
    'zip': 'application/zip',
    'gz': 'application/gzip',
    'mp3': 'audio/mpeg',
    'mp4': 'video/mp4',
  };

  return mimeTypes[ext] || 'application/octet-stream';
}

function isImageType(contentType) {
  return contentType && contentType.startsWith('image/');
}

function parseAttachments(attachments) {
  if (!Array.isArray(attachments)) return { cidMap: {}, inlineImages: [], downloadable: [] };

  const cidMap = {};
  const inlineImages = [];
  const downloadable = [];

  for (const att of attachments) {
    if (!att || typeof att !== 'object') continue;

    // Only accept base64 encoded content
    const content = att.content;
    if (!content || typeof content !== 'string') continue;
    if (att.encoding !== 'base64' && !isBase64(content)) continue;

    const contentType = getContentType(att);
    const dataUri = `data:${contentType};base64,${content.replace(/\s/g, '')}`;
    const filename = att.filename || 'attachment';
    const isImage = isImageType(contentType);
    const isInline = att.contentDisposition === 'inline' || att.cid;

    const parsedAtt = {
      filename,
      contentType,
      dataUri,
      cid: att.cid,
      isImage,
      size: Math.round((content.length * 3) / 4), // Approximate decoded size
    };

    // If has cid, add to cid map for replacement
    // Normalize cid by stripping <> like Nodemailer does
    if (att.cid) {
      const normalizedCid = att.cid.replace(/[<>]/g, '');
      cidMap[normalizedCid] = dataUri;
    }

    // Categorize attachment
    if (isInline && isImage) {
      // Inline image - will be shown in body or appended
      if (!att.cid) {
        inlineImages.push(parsedAtt);
      }
      // If has cid, it will be replaced in HTML, no need to add to inlineImages
    } else {
      // Downloadable attachment
      downloadable.push(parsedAtt);
    }
  }

  return { cidMap, inlineImages, downloadable };
}

function replaceCidReferences(html, cidMap) {
  if (!html || Object.keys(cidMap).length === 0) return html;

  // Replace cid:xxx references with data URIs
  // Normalize cid by stripping <> to match Nodemailer behavior
  return html.replace(/(['"])cid:([^'"]+)\1/gi, (match, quote, cid) => {
    const normalizedCid = cid.replace(/[<>]/g, '');
    const dataUri = cidMap[normalizedCid];
    if (dataUri) {
      return `${quote}${dataUri}${quote}`;
    }
    return match;
  });
}

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(contentType) {
  if (contentType.startsWith('image/')) return '🖼️';
  if (contentType.startsWith('audio/')) return '🎵';
  if (contentType.startsWith('video/')) return '🎬';
  if (contentType.includes('pdf')) return '📄';
  if (contentType.includes('word') || contentType.includes('document')) return '📝';
  if (contentType.includes('sheet') || contentType.includes('excel')) return '📊';
  if (contentType.includes('zip') || contentType.includes('gzip') || contentType.includes('archive')) return '📦';
  if (contentType.startsWith('text/')) return '📃';
  return '📎';
}

function AddressDisplay({ label, addresses }) {
  if (!addresses || addresses.length === 0) return null;

  return (
    <div className={styles.headerRow}>
      <span className={styles.headerLabel}>{label}:</span>
      <span className={styles.headerValue}>
        {addresses.map((addr, i) => (
          <span key={i} className={styles.addressChip}>
            {addr.name && <span className={styles.addressName}>{addr.name}</span>}
            <span className={styles.addressEmail}>&lt;{addr.address}&gt;</span>
            {i < addresses.length - 1 && ', '}
          </span>
        ))}
      </span>
    </div>
  );
}

function AttachmentList({ attachments }) {
  const handleDownload = useCallback((att) => {
    const link = document.createElement('a');
    link.href = att.dataUri;
    link.download = att.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  if (!attachments || attachments.length === 0) return null;

  return (
    <div className={styles.attachmentSection}>
      <div className={styles.attachmentHeader}>
        <span className={styles.attachmentIcon}>📎</span>
        <span className={styles.attachmentTitle}>
          {attachments.length} Attachment{attachments.length !== 1 ? 's' : ''}
        </span>
      </div>
      <div className={styles.attachmentList}>
        {attachments.map((att, i) => (
          <button
            key={i}
            className={styles.attachmentItem}
            onClick={() => handleDownload(att)}
            title={`Download ${att.filename}`}
          >
            <span className={styles.attachmentFileIcon}>{getFileIcon(att.contentType)}</span>
            <span className={styles.attachmentInfo}>
              <span className={styles.attachmentFilename}>{att.filename}</span>
              <span className={styles.attachmentSize}>{formatFileSize(att.size)}</span>
            </span>
            <span className={styles.downloadIcon}>⬇️</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function EmailPreview({ message }) {
  const from = useMemo(() => parseAddressList(message.from), [message.from]);
  const to = useMemo(() => parseAddressList(message.to), [message.to]);
  const cc = useMemo(() => parseAddressList(message.cc), [message.cc]);
  const bcc = useMemo(() => parseAddressList(message.bcc), [message.bcc]);
  const replyTo = useMemo(() => parseAddressList(message.replyTo), [message.replyTo]);

  const { cidMap, inlineImages, downloadable } = useMemo(
    () => parseAttachments(message.attachments),
    [message.attachments]
  );

  const htmlContent = useMemo(() => {
    let html = '';

    if (message.html) {
      html = replaceCidReferences(message.html, cidMap);
    } else if (message.text) {
      html = `<div style="font-family: monospace; white-space: pre-wrap;">${textToHtml(message.text)}</div>`;
    } else {
      html = '<p style="color: #888; font-style: italic;">No message content</p>';
    }

    // Append inline images that don't have cid references
    if (inlineImages.length > 0) {
      html += '<div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee;">';
      html += '<p style="color: #666; font-size: 12px; margin-bottom: 10px;">Inline Images:</p>';
      for (const img of inlineImages) {
        html += `<div style="margin-bottom: 10px;">
          <img src="${img.dataUri}" alt="${img.filename}" style="max-width: 100%; height: auto;">
          <p style="color: #888; font-size: 11px; margin: 4px 0 0 0;">${img.filename}</p>
        </div>`;
      }
      html += '</div>';
    }

    return html;
  }, [message.html, message.text, cidMap, inlineImages]);

  return (
    <div className={styles.emailPreview}>
      <div className={styles.emailHeader}>
        <div className={styles.subjectRow}>
          <h2 className={styles.subject}>{message.subject || '(No subject)'}</h2>
        </div>
        <div className={styles.addressSection}>
          <AddressDisplay label="From" addresses={from} />
          <AddressDisplay label="To" addresses={to} />
          <AddressDisplay label="Cc" addresses={cc} />
          <AddressDisplay label="Bcc" addresses={bcc} />
          <AddressDisplay label="Reply-To" addresses={replyTo} />
        </div>
      </div>

      <AttachmentList attachments={downloadable} />

      <div className={styles.emailBody}>
        <iframe
          className={styles.emailFrame}
          srcDoc={`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      font-size: 14px;
      line-height: 1.5;
      color: #333;
      margin: 0;
      padding: 16px;
    }
    a { color: #0066cc; }
    img { max-width: 100%; height: auto; }
  </style>
</head>
<body>${htmlContent}</body>
</html>`}
          title="Email Preview"
          sandbox="allow-same-origin"
        />
      </div>
    </div>
  );
}

function JsonEditor({ value, onChange, error, errorType }) {
  return (
    <div className={styles.editorContainer}>
      <div className={styles.editorHeader}>
        <span className={styles.editorTitle}>Message Configuration (JSON)</span>
        {error && (
          <span className={styles.errorBadge}>
            {errorType === 'syntax' ? 'Invalid JSON' : 'Validation Error'}
          </span>
        )}
      </div>
      <textarea
        className={`${styles.jsonEditor} ${error ? styles.jsonEditorError : ''}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        placeholder="Enter message configuration JSON..."
      />
      {error && (
        <div className={styles.errorMessage}>
          {error}
        </div>
      )}
    </div>
  );
}

function ValidationErrorDisplay({ error }) {
  return (
    <div className={styles.validationError}>
      <div className={styles.validationErrorIcon}>⚠️</div>
      <div className={styles.validationErrorTitle}>Invalid Message Configuration</div>
      <div className={styles.validationErrorMessage}>{error}</div>
    </div>
  );
}

export default function EmailPlayground() {
  const [jsonValue, setJsonValue] = useState(JSON.stringify(DEFAULT_MESSAGE, null, 2));
  const [error, setError] = useState(null);
  const [errorType, setErrorType] = useState(null);

  const message = useMemo(() => {
    try {
      const parsed = JSON.parse(jsonValue);

      // Validate the parsed message
      const validationError = validateMessage(parsed);
      if (validationError) {
        setError(validationError);
        setErrorType('validation');
        return null;
      }

      setError(null);
      setErrorType(null);
      return parsed;
    } catch (e) {
      setError(e.message);
      setErrorType('syntax');
      return null;
    }
  }, [jsonValue]);

  const handleReset = () => {
    setJsonValue(JSON.stringify(DEFAULT_MESSAGE, null, 2));
    setError(null);
    setErrorType(null);
  };

  return (
    <div className={styles.playground}>
      <div className={styles.tabsWrapper}>
        <Tabs>
          <TabItem value="editor" label={error ? "Editor ⚠️" : "Editor"} default>
            <div className={styles.editorPane}>
              <JsonEditor
                value={jsonValue}
                onChange={setJsonValue}
                error={error}
                errorType={errorType}
              />
            </div>
          </TabItem>
          <TabItem value="preview" label="Preview">
            <div className={styles.previewPane}>
              {error ? (
                <ValidationErrorDisplay error={error} />
              ) : (
                <EmailPreview message={message} />
              )}
            </div>
          </TabItem>
        </Tabs>
        <button className={styles.resetButton} onClick={handleReset}>
          Reset
        </button>
      </div>
    </div>
  );
}
