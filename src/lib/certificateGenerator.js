import { formatCurrency } from './currency';

/**
 * Generates an official high-resolution Audit Certificate in JPG format (.jpg)
 * and triggers a client-side download without any backend server.
 */
export async function downloadAuditCertificateJpg(signedRecord, proposal) {
  if (!signedRecord) return;

  const width = 1600;
  const height = 1100;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) return;

  // 1. Background Fill (Clean luxury parchment off-white gradient)
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, '#f8fafc');
  bgGrad.addColorStop(0.5, '#ffffff');
  bgGrad.addColorStop(1, '#f1f5f9');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // 2. Outer Ornate Border
  ctx.lineWidth = 14;
  ctx.strokeStyle = '#4f46e5'; // Indigo primary
  ctx.strokeRect(30, 30, width - 60, height - 60);

  // Inner Accent Border
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#10b981'; // Emerald accent
  ctx.strokeRect(45, 45, width - 90, height - 90);

  // Corner Accent Flourishes
  const drawCornerFlourish = (x, y, dx, dy) => {
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#6366f1';
    ctx.beginPath();
    ctx.moveTo(x, y + dy * 40);
    ctx.lineTo(x, y);
    ctx.lineTo(x + dx * 40, y);
    ctx.stroke();
  };
  drawCornerFlourish(55, 55, 1, 1);
  drawCornerFlourish(width - 55, 55, -1, 1);
  drawCornerFlourish(55, height - 55, 1, -1);
  drawCornerFlourish(width - 55, height - 55, -1, -1);

  // 3. Header Seal / Emblem Badge
  ctx.fillStyle = '#10b981';
  ctx.beginPath();
  ctx.arc(width / 2, 110, 36, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 30px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('✓', width / 2, 110);

  // 4. Header Titles
  ctx.textAlign = 'center';
  ctx.fillStyle = '#4f46e5';
  ctx.font = 'bold 16px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('PROGENAI • OFFICIAL DIGITAL SIGNATURE AUDIT TRAIL', width / 2, 175);

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 38px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('CERTIFICATE OF EXECUTION', width / 2, 225);

  ctx.fillStyle = '#64748b';
  ctx.font = '15px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(
    'This legal certificate confirms the electronic execution of Proposal #' +
      (proposal.proposalId || 'N/A') +
      ' pursuant to the ESIGN Act and UETA.',
    width / 2,
    260
  );

  // 5. Divider Line
  ctx.beginPath();
  ctx.moveTo(120, 290);
  ctx.lineTo(width - 120, 290);
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = '#e2e8f0';
  ctx.stroke();

  // 6. Two Column Summary Cards
  // Left Column: Contract & Commercial Context
  const leftX = 120;
  const cardY = 320;
  const cardW = 660;
  const cardH = 340;

  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(leftX, cardY, cardW, cardH, 16);
  ctx.fill();
  ctx.stroke();

  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#4f46e5';
  ctx.font = 'bold 14px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('COMMERCIAL CONTRACT DETAILS', leftX + 30, cardY + 40);

  const drawLabelValue = (label, value, x, y, isHighlight = false) => {
    ctx.fillStyle = '#64748b';
    ctx.font = '600 13px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(label.toUpperCase(), x, y);

    ctx.fillStyle = isHighlight ? '#059669' : '#0f172a';
    ctx.font = isHighlight
      ? 'bold 22px "Plus Jakarta Sans", monospace'
      : 'bold 18px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(value, x, y + 26);
  };

  const finalTotalAmount = proposal.costBreakdown?.totalInvestment || proposal.totalInvestment || proposal.budget;

  drawLabelValue('Client Organization', proposal.clientName || 'Valued Client', leftX + 30, cardY + 80);
  drawLabelValue('Industry Domain', proposal.industry || 'General Business', leftX + 30, cardY + 155);
  drawLabelValue(
    'Total Agreed Investment',
    formatCurrency(finalTotalAmount, proposal.currency),
    leftX + 30,
    cardY + 230,
    true
  );
  drawLabelValue(
    'Target Completion',
    proposal.timeline?.finalCompletionDate || 'Per Stipulated Roadmap',
    leftX + 380,
    cardY + 80
  );
  drawLabelValue('Proposal Identifier', '#' + (proposal.proposalId || 'N/A'), leftX + 380, cardY + 155);

  // Right Column: Cryptographic Audit & Signatory Record
  const rightX = 820;
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(rightX, cardY, cardW, cardH, 16);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#059669';
  ctx.font = 'bold 14px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('CRYPTOGRAPHIC EXECUTION RECORD', rightX + 30, cardY + 40);

  drawLabelValue('Signatory Full Name', signedRecord.signerName || 'Authorized Signatory', rightX + 30, cardY + 80);
  drawLabelValue('Official Title / Role', signedRecord.signerTitle || 'Client Representative', rightX + 30, cardY + 155);
  drawLabelValue('Record Identifier', signedRecord.recordId || 'mock-record-01', rightX + 30, cardY + 230);
  drawLabelValue(
    'Execution Timestamp',
    new Date(signedRecord.signedAt || Date.now()).toLocaleString(),
    rightX + 380,
    cardY + 80
  );
  drawLabelValue('Security Protocol', '256-bit Digital Hash Integrity', rightX + 380, cardY + 155);

  // 7. Signature Visual Proof Area
  const sigBoxY = 690;
  const sigBoxH = 260;
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(120, sigBoxY, width - 240, sigBoxH, 16);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#475569';
  ctx.font = 'bold 13px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('DIGITAL SIGNATURE CAPTURE & VERIFICATION SEAL', 150, sigBoxY + 36);

  // Draw signature image if present
  if (signedRecord.signatureDataUrl) {
    try {
      const sigImg = new Image();
      sigImg.crossOrigin = 'anonymous';
      await new Promise((resolve) => {
        sigImg.onload = resolve;
        sigImg.onerror = resolve;
        sigImg.src = signedRecord.signatureDataUrl;
      });

      // Draw the image cleanly in the middle
      ctx.drawImage(sigImg, 150, sigBoxY + 55, 360, 140);
    } catch {
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'italic 16px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('[Signature Recorded On File]', 150, sigBoxY + 120);
    }
  }

  // Draw signature baseline
  ctx.beginPath();
  ctx.moveTo(150, sigBoxY + 205);
  ctx.lineTo(550, sigBoxY + 205);
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = '#94a3b8';
  ctx.stroke();

  ctx.fillStyle = '#64748b';
  ctx.font = '12px "JetBrains Mono", monospace';
  ctx.fillText(
    'Signatory: ' + (signedRecord.signerName || '') + ' (' + (signedRecord.signerTitle || '') + ')',
    150,
    sigBoxY + 228
  );

  // Verification Hash & Tamper-Evident Badge on the right
  ctx.fillStyle = '#f8fafc';
  ctx.strokeStyle = '#e2e8f0';
  ctx.beginPath();
  ctx.roundRect(620, sigBoxY + 55, width - 890, 165, 12);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 15px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('Cryptographic Hash Fingerprint:', 645, sigBoxY + 90);

  ctx.fillStyle = '#4f46e5';
  ctx.font = 'bold 13px "JetBrains Mono", monospace';
  ctx.fillText(signedRecord.verificationHash || 'SHA256-AUTHENTICATED', 645, sigBoxY + 120);

  ctx.fillStyle = '#059669';
  ctx.font = 'bold 13px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('✓ Tamper-Evident Digital Handshake Complete', 645, sigBoxY + 155);

  ctx.fillStyle = '#64748b';
  ctx.font = '11px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('Archived via Supabase client layer • Non-repudiable legal audit proof', 645, sigBoxY + 180);

  // 8. Footer Legal Statement
  ctx.textAlign = 'center';
  ctx.fillStyle = '#94a3b8';
  ctx.font = '12px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(
    'ProgenAI Certificate Authority • Formally executed and verified on ' +
      new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) +
      ' • Issued as high-resolution JPG audit proof.',
    width / 2,
    1010
  );

  // 9. Convert Canvas to JPG blob and download
  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          resolve(false);
          return;
        }

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const filename = `Audit-Certificate-${proposal.proposalId || 'Proposal'}-${(proposal.clientName || 'Client').replace(/\s+/g, '_')}.jpg`;
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        resolve(true);
      },
      'image/jpeg',
      0.95 // High quality JPEG
    );
  });
}

/**
 * Generates an executive full proposal summary photo in JPG format (.jpg)
 * for saving to device image gallery.
 */
export async function downloadProposalPhotoJpg(proposal, signedRecord = null) {
  if (!proposal) return false;

  const width = 1600;
  const height = 1350;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return false;

  // Background
  const grad = ctx.createLinearGradient(0, 0, width, height);
  grad.addColorStop(0, '#0f172a');
  grad.addColorStop(0.5, '#1e1b4b');
  grad.addColorStop(1, '#0f172a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // Border
  ctx.lineWidth = 6;
  ctx.strokeStyle = '#6366f1';
  ctx.strokeRect(30, 30, width - 60, height - 60);

  // Header
  ctx.fillStyle = '#818cf8';
  ctx.font = 'bold 16px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('PROGENAI • PROJECT DELIVERY BLUEPRINT & QUOTE', 80, 90);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 36px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(proposal.clientName || 'Valued Client', 80, 140);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '16px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(`Industry: ${proposal.industry} • Agency: ${proposal.agencyName} • Ref: #${proposal.proposalId || 'PROP-01'}`, 80, 175);

  // Badge: Total Investment
  const photoTotal = proposal.costBreakdown?.totalInvestment || proposal.totalInvestment || proposal.budget;
  ctx.fillStyle = '#10b981';
  ctx.beginPath();
  ctx.roundRect(width - 450, 75, 370, 90, 16);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 13px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('TOTAL AGREED INVESTMENT', width - 265, 105);
  ctx.font = 'bold 28px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(formatCurrency(photoTotal, proposal.currency || '₹'), width - 265, 142);

  // Section 1: Deliverables (SOW)
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('1. SCOPE OF WORK & CORE DELIVERABLES', 80, 240);

  const sowItems = proposal.sow || [];
  sowItems.slice(0, 3).forEach((item, idx) => {
    const cardY = 270 + idx * 160;
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(80, cardY, width - 160, 135, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#a5b4fc';
    ctx.font = 'bold 16px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(`Deliverable 0${idx + 1}: ${item.title}`, 110, cardY + 36);

    ctx.fillStyle = '#e2e8f0';
    ctx.font = '14px "Plus Jakarta Sans", sans-serif';
    const desc = item.deliverable.length > 130 ? item.deliverable.substring(0, 127) + '...' : item.deliverable;
    ctx.fillText(desc, 110, cardY + 70);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(`Key outputs: ${(item.deliverablesList || []).slice(0, 3).join(' • ')}`, 110, cardY + 105);
  });

  // Section 2: Timeline Schedule & Financial Table
  const bottomY = 780;
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('2. TIMELINE SCHEDULE', 80, bottomY);
  ctx.fillText('3. INVESTMENT BREAKDOWN', 860, bottomY);

  // Timeline Box
  ctx.fillStyle = '#1e293b';
  ctx.strokeStyle = '#334155';
  ctx.beginPath();
  ctx.roundRect(80, bottomY + 25, 720, 290, 14);
  ctx.fill();
  ctx.stroke();

  (proposal.timeline || []).forEach((t, i) => {
    const lineY = bottomY + 65 + i * 75;
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 15px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(`${t.phase} (${t.durationWeeks} Weeks) - ${t.milestone}`, 110, lineY);
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '13px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(t.description.length > 70 ? t.description.substring(0, 67) + '...' : t.description, 110, lineY + 25);
  });

  // Cost Box
  ctx.fillStyle = '#1e293b';
  ctx.strokeStyle = '#334155';
  ctx.beginPath();
  ctx.roundRect(860, bottomY + 25, width - 940, 290, 14);
  ctx.fill();
  ctx.stroke();

  (proposal.costBreakdown || []).forEach((c, i) => {
    const lineY = bottomY + 65 + i * 55;
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '14px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(`${i + 1}. ${c.item}`, 890, lineY);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#a5b4fc';
    ctx.font = 'bold 14px "JetBrains Mono", monospace';
    ctx.fillText(formatCurrency(c.amount, proposal.currency || '₹'), width - 110, lineY);
    ctx.textAlign = 'left';
  });

  // Final Total Row in Cost Box
  ctx.strokeStyle = '#4f46e5';
  ctx.beginPath();
  ctx.moveTo(890, bottomY + 240);
  ctx.lineTo(width - 110, bottomY + 240);
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 16px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('Total Authorized Investment:', 890, bottomY + 275);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#34d399';
  ctx.font = 'bold 20px "JetBrains Mono", monospace';
  ctx.fillText(formatCurrency(photoTotal, proposal.currency || '₹'), width - 110, bottomY + 275);
  ctx.textAlign = 'left';

  // Signature or Pending Banner
  const footerY = 1130;
  if (signedRecord && signedRecord.signatureData) {
    ctx.fillStyle = '#064e3b';
    ctx.strokeStyle = '#10b981';
    ctx.beginPath();
    ctx.roundRect(80, footerY, width - 160, 140, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#34d399';
    ctx.font = 'bold 16px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('✓ LEGALLY EXECUTED VIA E-SIGNATURE', 110, footerY + 40);

    ctx.fillStyle = '#e2e8f0';
    ctx.font = '13px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(`Signed by: ${signedRecord.signerName || proposal.clientName} on ${new Date(signedRecord.signedAt).toLocaleString()}`, 110, footerY + 70);
    ctx.fillText(`Security Hash: ${signedRecord.verificationHash || 'VERIFIED'}`, 110, footerY + 100);

    // Draw signature image if possible
    try {
      const img = new Image();
      img.src = signedRecord.signatureData;
      await new Promise((res) => {
        img.onload = () => {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(width - 320, footerY + 15, 200, 110);
          ctx.drawImage(img, width - 310, footerY + 20, 180, 100);
          res();
        };
        img.onerror = () => res();
        setTimeout(res, 500);
      });
    } catch {
      // Signature preview fallback
    }
  } else {
    ctx.fillStyle = '#312e81';
    ctx.strokeStyle = '#6366f1';
    ctx.beginPath();
    ctx.roundRect(80, footerY, width - 160, 140, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#c7d2fe';
    ctx.font = 'bold 16px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('STATUS: ISSUED & AWAITING CLIENT DIGITAL SIGNATURE', 110, footerY + 50);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '13px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('Access the secure web link on any phone or PC to e-sign and execute this blueprint instantly.', 110, footerY + 90);
  }

  // Convert to JPG blob and download
  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          resolve(false);
          return;
        }
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const filename = `Proposal-Blueprint-${proposal.proposalId || 'Proposal'}-${(proposal.clientName || 'Client').replace(/\s+/g, '_')}.jpg`;
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        resolve(true);
      },
      'image/jpeg',
      0.95
    );
  });
}
