
const { Telegraf, Markup } = require('telegraf');

const bot = new Telegraf('7858747607:AAFuZoxMJv2PcsGQPMIjcjdhOnCm1IWLmH8');

const questions = [];
const consultations = [];
const prices = [];

const ADMIN_USERNAME = 'prudnykov_lawyer';

bot.start((ctx) => {
  ctx.reply('Вітаю! Оберіть дію:',
    Markup.keyboard([
      ['/zapytannia', '/konsultatsiia'],
      ['/tsina']
    ]).resize()
  );
});

bot.command('zapytannia', (ctx) => {
  ctx.reply('📝 Будь ласка, поставте коротке запитання (не більше 2–4 речень).');
  ctx.session = { mode: 'zapytannia' };
});

bot.command('konsultatsiia', (ctx) => {
  ctx.reply('📞 Введіть свій номер телефону (формат: +380...)');
  ctx.session = { mode: 'konsultatsiia', step: 1 };
});

bot.command('tsina', (ctx) => {
  ctx.reply('📞 Введіть свій номер телефону (формат: +380...)');
  ctx.session = { mode: 'tsina', step: 1 };
});

bot.on('message', async (ctx, next) => {
  const text = ctx.message.text || '';
  if (/http[s]?:\/\//.test(text)) {
    await ctx.deleteMessage();
    return;
  }
  return next();
});

bot.on('text', (ctx) => {
  const user = ctx.from;
  const text = ctx.message.text;
  const session = ctx.session || {};

  if (!session.mode) return;

  if (session.mode === 'zapytannia') {
    questions.push({ user, text });
    ctx.reply('✅ Ваше запитання збережено. Адміністратор відповість у цьому чаті.');
    ctx.session = null;
  } else if (session.mode === 'konsultatsiia') {
    if (session.step === 1) {
      ctx.session.phone = text;
      ctx.session.step = 2;
      ctx.reply('📝 Коротко опишіть суть вашого питання (2–5 речень).');
    } else if (session.step === 2) {
      consultations.push({ user, phone: ctx.session.phone, question: text });
      ctx.reply('✅ Ваш запит на консультацію збережено. Очікуйте відповіді.');
      ctx.session = null;
    }
  } else if (session.mode === 'tsina') {
    if (session.step === 1) {
      ctx.session.phone = text;
      ctx.session.step = 2;
      ctx.reply('📝 Коротко опишіть, з якого питання ви звертаєтесь (2–5 речень).');
    } else if (session.step === 2) {
      prices.push({ user, phone: ctx.session.phone, question: text });
      ctx.reply('✅ Ваш запит збережено. Ми повідомимо вам вартість найближчим часом.');
      ctx.session = null;
    }
  }
});

bot.command('adminpanel', (ctx) => {
  if (ctx.from.username !== ADMIN_USERNAME) return ctx.reply('⛔️ Доступ заборонено');

  let response = '📋 Запити:\n\n';
  response += '\n❓ Питання:\n' + (questions.map((q, i) => `${i + 1}) ${q.text} — @${q.user.username}`).join('\n') || 'немає');
  response += '\n\n📅 Консультації:\n' + (consultations.map((q, i) => `${i + 1}) ${q.phone}: ${q.question} — @${q.user.username}`).join('\n') || 'немає');
  response += '\n\n💰 Ціна:\n' + (prices.map((q, i) => `${i + 1}) ${q.phone}: ${q.question} — @${q.user.username}`).join('\n') || 'немає');

  ctx.reply(response);
});

bot.launch();
console.log('✅ Бот запущено');
