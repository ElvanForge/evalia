<script lang="ts">
	const launchTiers = {
		starter: "https://buy.stripe.com/aFa9AV2w78hdevadsabjW00",
		pioneer: "https://buy.stripe.com/14AcN74Ef9lh72I3RAbjW01",
		advisor: "https://buy.stripe.com/aFa7sN3AbgNJ72I73MbjW02"
	};

	const LAUNCH_DATE = "August 15, 2026";
	const SEED_GOAL = 15000;
	let current_raised = 0;

	$: progress_percent = Math.min(Math.round((current_raised / SEED_GOAL) * 100), 100);

	const features = [
		{
			title: "Grade Stewardship",
			desc: "Secure, encrypted performance tracking designed for privacy and professional precision.",
			img: "/images/feature-grades.webp"
		},
		{
			title: "Lesson Intelligence",
			desc: "High-performance AI to generate structured lesson plans and slide decks in seconds.",
			img: "/images/feature-lessons.webp"
		},
		{
			title: "Automated Reporting",
			desc: "Guided AI synthesis transforms classroom data into empathetic PDF reports and communications.",
			img: "/images/feature-reports.webp"
		}
	];

	const faqs = [
		{ 
			q: "Is the Pioneer tier really a one-time payment?", 
			a: "Yes. Seed Pioneers receive a permanent license. When Evalia moves to a $19/mo subscription at launch, your account remains active forever with no further billing."
		},
		{ 
			q: "What does Advisory Status mean?", 
			a: "Advisors get direct access to our development team via a 1-on-1 call to discuss specific classroom needs and influence which features we prioritize next."
		},
		{ 
			q: "When do I get access?", 
			a: "Early Supporters and Pioneers get Alpha/Beta access starting 30 days before the official August launch."
		}
	];
</script>

<div class="min-h-screen bg-vanilla-50 font-sans text-ink-950 relative overflow-hidden">
	<nav class="relative z-30 max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
		<div class="flex items-center gap-4 group cursor-pointer">
			<div class="relative w-10 h-10 flex items-center justify-center">
				<div class="absolute inset-0 bg-teal-800 rounded-lg shadow-lg"></div>
				<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
					<rect width="40" height="40" rx="8" fill="#115e59"/> 
					<path d="M12 14H28" stroke="#faf6ea" stroke-width="4" stroke-linecap="butt"/>
					<path d="M12 20H22" stroke="#faf6ea" stroke-width="4" stroke-linecap="butt"/>
					<path d="M12 26H28" stroke="#faf6ea" stroke-width="4" stroke-linecap="butt"/>
					<path d="M12 14V26" stroke="#faf6ea" stroke-width="4" stroke-linecap="butt"/>
				</svg>
			</div>
			<span class="text-2xl font-black tracking-tighter text-ink-950 uppercase italic leading-none">Evalia</span>
		</div>
		<div class="hidden md:flex gap-10 items-center font-bold text-ink-700 text-xs tracking-widest uppercase">
			<a href="#features" class="hover:text-teal-600 transition-colors">Features</a>
			<a href="#pricing" class="hover:text-teal-600 transition-colors">Seeding Phase</a>
			<div class="px-5 py-2 border-2 border-ink-950 rounded-lg text-ink-950 font-black italic">LAUNCH: {LAUNCH_DATE}</div>
		</div>
	</nav>

	<header class="relative py-8 lg:py-16 px-6 z-10">
		<div class="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-center">
			<div class="space-y-8 text-center lg:text-left">
				<div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-teal-200 text-teal-800 font-bold text-xs tracking-widest bg-teal-50/50 backdrop-blur-md">
					OFFICIAL SEEDING PHASE OPEN
				</div>
				<h1 class="text-6xl md:text-8xl font-black leading-[0.9] tracking-tighter text-ink-950">
					The workstation for <br/> 
					<span class="text-teal-600 underline decoration-ink-950/10">modern educators.</span>
				</h1>
				<p class="text-xl text-ink-800 leading-relaxed max-w-lg font-medium mx-auto lg:mx-0">
					High-performance tools for grades, lesson planning, and reporting.
					Harness <span class="text-teal-700 font-bold italic">Educational AI</span> to reclaim your time.
				</p>
				<div class="pt-4">
					<a href="#pricing" style="color: #faf6ea !important;" class="inline-flex items-center justify-center gap-3 bg-teal-800 px-10 py-5 rounded-2xl font-black text-lg shadow-2xl shadow-teal-900/30 transition-all hover:bg-teal-900 hover:scale-[1.02]">
						Support the Seeding Phase <span>→</span>
					</a>
				</div>
			</div>
			<div class="relative">
				<div class="absolute -inset-10 bg-teal-400/15 blur-3xl rounded-full"></div>
				<div class="relative bg-white/40 backdrop-blur-2xl p-3 rounded-[2.5rem] shadow-2xl border border-white/60">
					<img src="/images/hero-workspace.webp" alt="Evalia Preview" class="rounded-[1.8rem] w-full h-auto object-cover border border-ink-100/20" />
				</div>
			</div>
		</div>
	</header>

	<section id="features" class="relative py-24 px-6 z-10 bg-white/40 border-y border-ink-100/20">
		<div class="max-w-7xl mx-auto text-center">
			<h2 class="text-4xl font-black text-ink-950 tracking-tight italic uppercase mb-20">Intelligence Meets Academics.</h2>
			<div class="grid md:grid-cols-3 gap-16">
				{#each features as feature}
					<div class="group space-y-8 text-left">
						<div class="aspect-video bg-vanilla-100 rounded-[2rem] border border-ink-100/50 overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500">
							<img src={feature.img} alt={feature.title} class="w-full h-full object-cover" />
						</div>
						<div class="space-y-4 px-2">
							<h3 class="text-2xl font-black text-ink-950 tracking-tight italic">{feature.title}</h3>
							<p class="text-ink-700 font-medium leading-relaxed">{feature.desc}</p>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<section id="pricing" class="relative py-24 px-6 z-10">
		<div class="max-w-7xl mx-auto">
			<div class="max-w-2xl mb-16 space-y-6 text-left">
				<h2 class="text-5xl font-black text-ink-950 tracking-tighter italic uppercase leading-none">Support the <br/>Seeding Phase.</h2>
				<p class="text-lg text-ink-700 font-medium leading-relaxed">
					We are raising seed capital to finalize development.
					Supporters receive permanent license status before our <span class="text-ink-950 font-bold">$19/mo</span> launch.
				</p>
				<div class="pt-4 max-w-md">
					<div class="flex justify-between items-end mb-2">
						<span class="text-[10px] font-black tracking-widest text-ink-400 uppercase">Strategic Funding: Phase 1</span>
						<span class="text-sm font-black text-teal-600">{progress_percent}% Funded</span>
					</div>
					<div class="w-full h-4 bg-ink-100 rounded-full p-1 border border-ink-200 overflow-hidden">
						<div class="h-full bg-teal-500 rounded-full transition-all duration-1000 ease-out" style="width: {progress_percent}%"></div>
					</div>
					<p class="mt-2 text-[9px] font-bold text-ink-500 uppercase tracking-tighter">
						Target: ${SEED_GOAL.toLocaleString()} USD | Infrastructure & Engineering Runway
					</p>
				</div>
			</div>

			<div class="grid md:grid-cols-3 gap-8 items-stretch">
				<div class="bg-white p-10 rounded-[2.5rem] border-2 border-ink-100 shadow-sm flex flex-col justify-between">
					<div class="space-y-4">
						<h3 class="text-xl font-black text-ink-950 tracking-tight uppercase">Early Supporter</h3>
						<div class="text-4xl font-black text-teal-600 tracking-tighter">$49</div>
						<ul class="space-y-4 pt-6 text-sm font-bold text-ink-800">
							<li class="flex items-start gap-2"><span>•</span> 1 Month Early Beta Access</li>
							<li class="flex items-start gap-2"><span>•</span> 2 Months Pro Access Post-Launch</li>
						</ul>
					</div>
					<a href={launchTiers.starter} class="mt-8 block text-center py-4 border-2 border-teal-800 text-teal-800 rounded-xl font-black hover:bg-teal-50 transition-all uppercase tracking-widest text-xs">Support Evalia</a>
				</div>

				<div class="bg-white p-10 rounded-[2.5rem] border-2 border-teal-600 shadow-xl flex flex-col justify-between relative transform lg:-translate-y-4">
					<div class="absolute -top-4 left-1/2 -translate-x-1/2 bg-teal-600 text-vanilla-50 px-4 py-1 rounded-full text-[10px] font-black tracking-widest uppercase">LIFETIME STATUS</div>
					<div class="space-y-4">
						<h3 class="text-xl font-black text-ink-950 tracking-tight uppercase italic">Seed Pioneer</h3>
						<div class="text-4xl font-black text-teal-600 tracking-tighter">$249</div>
						<ul class="space-y-4 pt-6 text-sm font-bold text-ink-800">
							<li class="flex items-start gap-2"><span>•</span> Permanent Lifetime License</li>
							<li class="flex items-start gap-2"><span>•</span> All Future Feature Modules</li>
							<li class="flex items-start gap-2"><span>•</span> No Subscriptions Ever</li>
						</ul>
					</div>
					<a href={launchTiers.pioneer} style="color: #faf6ea !important;" class="mt-8 block text-center py-4 bg-teal-800 rounded-xl font-black shadow-xl uppercase tracking-widest text-xs">Secure Lifetime</a>
				</div>

				<div class="bg-teal-900 p-10 rounded-[2.5rem] shadow-2xl flex flex-col justify-between border-2 border-teal-400">
					<div class="space-y-4">
						<h3 style="color: #faf6ea !important;" class="text-xl font-black tracking-tight uppercase">Strategic Advisor</h3>
						<div class="text-4xl font-black text-teal-400 tracking-tighter">$499</div>
						<ul style="color: #faf6ea !important;" class="space-y-4 pt-6 text-sm font-bold">
							<li class="flex items-start gap-2"><span class="text-teal-400">•</span> Lifetime Access + Priority Beta</li>
							<li class="flex items-start gap-2"><span class="text-teal-400">•</span> 1-on-1 Implementation Call</li>
							<li class="flex items-start gap-2"><span class="text-teal-400">•</span> Roadmap Advisory Access</li>
						</ul>
						<p class="text-[9px] uppercase font-bold text-teal-400/50 leading-tight pt-4 italic">
							*Commercial pre-order for premium services.
							Does not confer equity or financial interest.
						</p>
					</div>
					<a href={launchTiers.advisor} style="color: #0d1117 !important;" class="mt-10 block text-center py-5 bg-teal-400 rounded-2xl font-black shadow-xl uppercase tracking-widest text-xs">Join as Advisor</a>
				</div>
			</div>
		</div>
	</section>

	<section class="py-24 px-6 z-10 bg-vanilla-100/50">
		<div class="max-w-3xl mx-auto space-y-12">
			<h2 class="text-3xl font-black text-ink-950 tracking-tight italic uppercase text-center">Seeding FAQ</h2>
			<div class="space-y-8">
				{#each faqs as faq}
					<div class="space-y-2">
						<h4 class="text-lg font-black text-ink-950 uppercase tracking-tight">{faq.q}</h4>
						<p class="text-ink-700 font-medium leading-relaxed">{faq.a}</p>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<footer class="py-16 text-center opacity-40">
		<p class="text-ink-950 font-black text-[10px] tracking-[0.2em] uppercase mb-2">&copy; 2026 ELVAN FORGE | HIGH PERFORMANCE ACADEMICS</p>
		<p class="text-[9px] font-bold text-ink-950 uppercase tracking-tighter">Evalia is a product of Elvan Forge. Purchases during Seeding Phase are early-access software pre-orders.</p>
	</footer>
</div>

<style>
	:global(html) { scroll-behavior: smooth; }
	:global(body) { background-color: #faf6ea; margin: 0; color: #0d1117; }
</style>