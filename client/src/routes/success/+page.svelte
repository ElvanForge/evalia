<script>
    import { onMount } from 'svelte';
    import { page } from '$app/stores';

    let sessionId = $page.url.searchParams.get('session_id');
</script>

<div class="min-h-screen bg-vanilla-50 flex flex-col items-center justify-center p-6 text-center">
    <div class="w-20 h-20 bg-teal-800 rounded-2xl flex items-center justify-center mb-8 shadow-xl">
        <svg class="w-10 h-10 text-vanilla-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
        </svg>
    </div>
    
    <h1 class="text-5xl font-black text-ink-950 tracking-tighter italic uppercase mb-4">
        Welcome to the Forge.
    </h1>
    <p class="text-xl text-ink-700 max-w-md font-medium leading-relaxed">
        Your payment was successful. We’ve reserved your spot in the 
        <span class="text-teal-700 font-bold">Evalia Seeding Phase</span>.
    </p>

    <div class="mt-10 p-6 bg-white rounded-2xl border-2 border-ink-100 shadow-sm">
        <p class="text-[10px] font-black tracking-widest text-ink-400 uppercase mb-2">Transaction ID</p>
        <code class="text-xs font-mono text-teal-800 bg-teal-50 px-3 py-1 rounded">{sessionId}</code>
        <p class="mt-4 text-sm font-bold text-ink-600">Check your email for your official receipt and onboarding next steps.</p>
    </div>

    <a href="/" class="mt-12 text-ink-950 font-black uppercase tracking-widest text-xs hover:text-teal-600 transition-colors">
        ← Back to Evalia Home
    </a>
</div>