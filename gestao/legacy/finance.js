function financeDate(date) {
  return typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date) &&
    Number.isFinite(Date.parse(date)) && new Date(date).toISOString().slice(0,10) === date;
}

function financeMonth(date, offset) {
  const [year, month] = date.split('-').map(Number);
  const index = year * 12 + month - 1 + offset;
  return [Math.floor(index / 12), index % 12 + 1];
}

function financeMonthKey(year, month) {
  return String(year).padStart(4,'0') + '-' + String(month).padStart(2,'0');
}

function installmentSchedule(total, count, firstDue) {
  if (!Number.isSafeInteger(total) || !Number.isInteger(count) || count < 1 || count > 120 ||
      total < count || total > 100000000000 || !financeDate(firstDue) ||
      financeMonth(firstDue, count - 1)[0] > 9999) return [];
  const day = Number(firstDue.slice(-2));
  const base = Math.floor(total / count);
  const remainder = total % count;
  return Array.from({length:count}, (_, index) => {
    const [year, month] = financeMonth(firstDue, index);
    const last = new Date(Date.UTC(2000 + year % 400, month, 0)).getUTCDate();
    return {
      name: 'Parcela ' + (index + 1) + '/' + count,
      amount: base + Number(index >= count - remainder),
      due: financeMonthKey(year, month) + '-' + String(Math.min(day, last)).padStart(2,'0'),
    };
  });
}

function renderInstallments() {
  return `<section class="card"><h3>Gerar parcelamento</h3>
    <form id="installment-form" oninput="previewInstallments(this)" onsubmit="event.preventDefault();addInstallments(this)">
      <div class="grid">
        <div><label for="installment-total">Valor total combinado (R$)</label><input id="installment-total" name="total" type="number" min="0.01" max="1000000000" step="0.01" required style="width:100%"></div>
        <div><label for="installment-count">Número de parcelas</label><input id="installment-count" name="count" type="number" min="1" max="120" step="1" value="1" required style="width:100%"></div>
        <div><label for="installment-first">Vencimento da primeira parcela</label><input id="installment-first" name="first" type="date" required style="width:100%"></div>
        <div><label for="installment-method">Forma de pagamento</label><select id="installment-method" name="method" style="width:100%">${paymentMethods.map(method=>`<option>${method}</option>`).join('')}</select></div>
      </div>
      <p class="muted">As demais parcelas vencem no mesmo dia dos meses seguintes. Em meses mais curtos, o vencimento cai no último dia.</p>
      <div id="installment-preview" aria-live="polite"></div>
      <button class="primary" type="submit" disabled>Adicionar parcelas</button>
    </form></section>`;
}

function installmentsFromForm(form) {
  const {total,count,first} = form.elements;
  return form.checkValidity() ? installmentSchedule(Math.round(total.valueAsNumber * 100), count.valueAsNumber, first.value) : [];
}

function previewInstallments(form) {
  const rows = installmentsFromForm(form);
  const preview = form.querySelector('#installment-preview');
  form.querySelector('button[type=submit]').disabled = rows.length === 0 || form.hasAttribute('aria-busy');
  preview.innerHTML = rows.length
    ? `<details open><summary>Prévia de ${rows.length} parcela(s) · ${money(rows.reduce((sum,row)=>sum+row.amount,0))}</summary><ol>${rows.map(row=>`<li>${money(row.amount)} · ${financeDateLabel(row.due)}</li>`).join('')}</ol></details>`
    : form.checkValidity() ? '<p>O total deve cobrir pelo menos R$ 0,01 por parcela. Confira também a data informada.</p>' : '';
}

async function addInstallments(form) {
  const p = mentee(), rows = installmentsFromForm(form);
  if (!p || !rows.length) return;
  const button = form.querySelector('button[type=submit]');
  if (button.disabled) return;
  form.setAttribute('aria-busy','true');
  button.disabled = true;
  const method = form.elements.method.value;
  try {
    if (p.payments.length && !await cycleConfirm(`Adicionar ${rows.length} parcela(s) aos pagamentos que já existem?`)) return;
    if (!form.isConnected || mentee() !== p) return;
    const additions = rows.map(row=>({id:uid(),...row,method,notes:'',paid:false,paidDate:''}));
    const previous = p.payments;
    p.payments = previous.concat(additions);
    try { save(); } catch (error) { p.payments = previous; throw error; }
    render();
  } catch (error) {
    alert(error.message || 'Falha ao adicionar as parcelas.');
  } finally {
    form.removeAttribute('aria-busy');
    button.disabled = installmentsFromForm(form).length === 0;
  }
}

const financeDateLabel = date => date.split('-').reverse().join('/');
const financeMonthLabel = new Intl.DateTimeFormat('pt-BR',{month:'long',year:'numeric',timeZone:'UTC'});

function cashForecast(people, today) {
  const months = Array.from({length:12}, (_, index)=>{
    const [year, month] = financeMonth(today, index);
    return {key:financeMonthKey(year, month),amount:0,rows:[]};
  });
  const byMonth = new Map(months.map(month=>[month.key,month]));
  let overdue = 0, undated = 0;
  for (const person of people) {
    for (const payment of Array.isArray(person.payments) ? person.payments : []) {
      const amount = Number(payment?.amount);
      if (!payment || payment.paid || !Number.isSafeInteger(amount) || amount <= 0) continue;
      if (!financeDate(payment.due)) { undated += amount; continue; }
      if (payment.due < today) { overdue += amount; continue; }
      const month = byMonth.get(payment.due.slice(0,7));
      if (!month) continue;
      month.amount += amount;
      month.rows.push({name:person.name,label:payment.name,due:payment.due,amount});
    }
  }
  return {months,overdue,undated};
}

function renderCashFlow() {
  const {months,overdue,undated} = cashForecast(state.people,todayLocal());
  const total = months.reduce((sum,month)=>sum+month.amount,0);
  const peak = Math.max(1,...months.map(month=>month.amount));
  return `<header><div><div class="tag">Financeiro da mentoria</div><h2>Fluxo de caixa</h2>
    <p class="muted">Previsão de recebimentos do mês atual e dos 11 meses seguintes.</p></div></header>
    <div class="grid">
      <div class="card"><div class="muted">Previsto no período</div><h2>${money(total)}</h2></div>
      <div class="card"><div class="muted">Em atraso</div><h2>${money(overdue)}</h2></div>
      <div class="card"><div class="muted">Sem vencimento cadastrado</div><h2>${money(undated)}</h2></div>
    </div>
    <section class="card"><h3>Entradas previstas por mês</h3>
    ${months.map(month=>`<details style="border-bottom:1px solid #d5d5d5;padding:12px 0">
      <summary style="cursor:pointer"><strong>${financeMonthLabel.format(new Date(month.key+'-01T00:00:00Z'))}</strong>
      · ${money(month.amount)} · ${month.rows.length} parcela(s)</summary>
      <meter aria-label="Recebimento previsto em relação ao maior mês" value="${month.amount}" max="${peak}" style="width:100%;height:12px;margin-top:5px"></meter>
      ${month.rows.length ? `<ul>${month.rows.sort((a,b)=>a.due.localeCompare(b.due)).map(row=>`<li>${financeDateLabel(row.due)} · ${esc(row.name)} · ${esc(row.label || 'Parcela')} · ${money(row.amount)}</li>`).join('')}</ul>` : '<p class="muted">Nenhuma parcela prevista.</p>'}
    </details>`).join('')}
    <p class="muted">A projeção soma parcelas em aberto com vencimento no período. Valores em atraso e sem vencimento aparecem acima.</p></section>`;
}

const renderBeforeFinance = render;
render = function() {
  renderBeforeFinance();
  document.getElementById('nav').insertAdjacentHTML('beforeend',
    `<button class="${view==='cashflow'?'active':''}" onclick="go('cashflow')">Fluxo de caixa</button>`);
  const app = document.getElementById('app');
  if (view === 'cashflow') app.innerHTML = renderCashFlow();
  if (view === 'person' && menteeTab === 'payments' && !paymentEditId) {
    const tabs = app.querySelector('.tabs');
    if (tabs) tabs.insertAdjacentHTML('afterend', renderInstallments());
  }
};
