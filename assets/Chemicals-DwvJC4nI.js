import{K as Ct,r as y,aJ as zt,o as Et,u as At,a as It,q as Dt,g as U,aw as Mt,j as e,Q as Qe,c as be,d as Ye,F as Ot,S as oe,m as G,aK as Tt,f as $t,e as A,ah as Ee,T as Ae,V as Ht,A as ce,h as K,w as Ke,X as Ie,k as De,l as J,s as de,n as _t,i as ye,O as he,aL as Me,E as Lt,p as Rt,t as Ft,v as Xe,x as Je,ay as Gt}from"./index-D3UmL9HA.js";import{l as ve,L as we,a as je}from"./loggingService-HJT_1S5h.js";import{P as Pt}from"./pdfService-DiHavWKZ.js";import{Q as qt}from"./QRScanner-C7N_uYzv.js";import{D as Ze}from"./download-BJXcTKde.js";import{P as Ut}from"./plus-B8LM9BsC.js";import{F as Wt}from"./funnel-B_y4Amds.js";import{S as Bt}from"./square-pen-EewNoQr2.js";import{T as et}from"./trash-2-x0IG6v5e.js";import{R as Vt}from"./rotate-ccw-DC17NJJb.js";import{C as Qt}from"./chevron-up-BitzXsNH.js";import"./jspdf.plugin.autotable-3jPO6nlc.js";/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Yt=[["path",{d:"m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72",key:"ul74o6"}],["path",{d:"m14 7 3 3",key:"1r5n42"}],["path",{d:"M5 6v4",key:"ilb8ba"}],["path",{d:"M19 14v4",key:"blhpug"}],["path",{d:"M10 2v2",key:"7u0qdc"}],["path",{d:"M7 8H3",key:"zfb6yr"}],["path",{d:"M21 16h-4",key:"1cnmox"}],["path",{d:"M11 3H9",key:"1obp7u"}]],Kt=Ct("wand-sparkles",Yt);function Z(h,m,s){let a=s.initialDeps??[],r,n=!0;function c(){var d,f,k;let j;s.key&&((d=s.debug)!=null&&d.call(s))&&(j=Date.now());const w=h();if(!(w.length!==a.length||w.some((S,R)=>a[R]!==S)))return r;a=w;let o;if(s.key&&((f=s.debug)!=null&&f.call(s))&&(o=Date.now()),r=m(...w),s.key&&((k=s.debug)!=null&&k.call(s))){const S=Math.round((Date.now()-j)*100)/100,R=Math.round((Date.now()-o)*100)/100,E=R/16,I=(D,F)=>{for(D=String(D);D.length<F;)D=" "+D;return D};console.info(`%c⏱ ${I(R,5)} /${I(S,5)} ms`,`
            font-size: .6rem;
            font-weight: bold;
            color: hsl(${Math.max(0,Math.min(120-120*E,120))}deg 100% 31%);`,s==null?void 0:s.key)}return s!=null&&s.onChange&&!(n&&s.skipInitialOnChange)&&s.onChange(r),n=!1,r}return c.updateDeps=d=>{a=d},c}function tt(h,m){if(h===void 0)throw new Error("Unexpected undefined");return h}const Xt=(h,m)=>Math.abs(h-m)<1.01,Jt=(h,m,s)=>{let a;return function(...r){h.clearTimeout(a),a=h.setTimeout(()=>m.apply(this,r),s)}},st=h=>{const{offsetWidth:m,offsetHeight:s}=h;return{width:m,height:s}},Zt=h=>h,es=h=>{const m=Math.max(h.startIndex-h.overscan,0),s=Math.min(h.endIndex+h.overscan,h.count-1),a=[];for(let r=m;r<=s;r++)a.push(r);return a},ts=(h,m)=>{const s=h.scrollElement;if(!s)return;const a=h.targetWindow;if(!a)return;const r=c=>{const{width:d,height:f}=c;m({width:Math.round(d),height:Math.round(f)})};if(r(st(s)),!a.ResizeObserver)return()=>{};const n=new a.ResizeObserver(c=>{const d=()=>{const f=c[0];if(f!=null&&f.borderBoxSize){const k=f.borderBoxSize[0];if(k){r({width:k.inlineSize,height:k.blockSize});return}}r(st(s))};h.options.useAnimationFrameWithResizeObserver?requestAnimationFrame(d):d()});return n.observe(s,{box:"border-box"}),()=>{n.unobserve(s)}},at={passive:!0},rt=typeof window>"u"?!0:"onscrollend"in window,ss=(h,m)=>{const s=h.scrollElement;if(!s)return;const a=h.targetWindow;if(!a)return;let r=0;const n=h.options.useScrollendEvent&&rt?()=>{}:Jt(a,()=>{m(r,!1)},h.options.isScrollingResetDelay),c=j=>()=>{const{horizontal:w,isRtl:z}=h.options;r=w?s.scrollLeft*(z&&-1||1):s.scrollTop,n(),m(r,j)},d=c(!0),f=c(!1);s.addEventListener("scroll",d,at);const k=h.options.useScrollendEvent&&rt;return k&&s.addEventListener("scrollend",f,at),()=>{s.removeEventListener("scroll",d),k&&s.removeEventListener("scrollend",f)}},as=(h,m,s)=>{if(m!=null&&m.borderBoxSize){const a=m.borderBoxSize[0];if(a)return Math.round(a[s.options.horizontal?"inlineSize":"blockSize"])}return h[s.options.horizontal?"offsetWidth":"offsetHeight"]},rs=(h,{adjustments:m=0,behavior:s},a)=>{var r,n;const c=h+m;(n=(r=a.scrollElement)==null?void 0:r.scrollTo)==null||n.call(r,{[a.options.horizontal?"left":"top"]:c,behavior:s})};class is{constructor(m){this.unsubs=[],this.scrollElement=null,this.targetWindow=null,this.isScrolling=!1,this.scrollState=null,this.measurementsCache=[],this.itemSizeCache=new Map,this.laneAssignments=new Map,this.pendingMeasuredCacheIndexes=[],this.prevLanes=void 0,this.lanesChangedFlag=!1,this.lanesSettling=!1,this.scrollRect=null,this.scrollOffset=null,this.scrollDirection=null,this.scrollAdjustments=0,this.elementsCache=new Map,this.now=()=>{var s,a,r;return((r=(a=(s=this.targetWindow)==null?void 0:s.performance)==null?void 0:a.now)==null?void 0:r.call(a))??Date.now()},this.observer=(()=>{let s=null;const a=()=>s||(!this.targetWindow||!this.targetWindow.ResizeObserver?null:s=new this.targetWindow.ResizeObserver(r=>{r.forEach(n=>{const c=()=>{const d=n.target,f=this.indexFromElement(d);if(!d.isConnected){this.observer.unobserve(d);return}this.shouldMeasureDuringScroll(f)&&this.resizeItem(f,this.options.measureElement(d,n,this))};this.options.useAnimationFrameWithResizeObserver?requestAnimationFrame(c):c()})}));return{disconnect:()=>{var r;(r=a())==null||r.disconnect(),s=null},observe:r=>{var n;return(n=a())==null?void 0:n.observe(r,{box:"border-box"})},unobserve:r=>{var n;return(n=a())==null?void 0:n.unobserve(r)}}})(),this.range=null,this.setOptions=s=>{Object.entries(s).forEach(([a,r])=>{typeof r>"u"&&delete s[a]}),this.options={debug:!1,initialOffset:0,overscan:1,paddingStart:0,paddingEnd:0,scrollPaddingStart:0,scrollPaddingEnd:0,horizontal:!1,getItemKey:Zt,rangeExtractor:es,onChange:()=>{},measureElement:as,initialRect:{width:0,height:0},scrollMargin:0,gap:0,indexAttribute:"data-index",initialMeasurementsCache:[],lanes:1,isScrollingResetDelay:150,enabled:!0,isRtl:!1,useScrollendEvent:!1,useAnimationFrameWithResizeObserver:!1,laneAssignmentMode:"estimate",...s}},this.notify=s=>{var a,r;(r=(a=this.options).onChange)==null||r.call(a,this,s)},this.maybeNotify=Z(()=>(this.calculateRange(),[this.isScrolling,this.range?this.range.startIndex:null,this.range?this.range.endIndex:null]),s=>{this.notify(s)},{key:!1,debug:()=>this.options.debug,initialDeps:[this.isScrolling,this.range?this.range.startIndex:null,this.range?this.range.endIndex:null]}),this.cleanup=()=>{this.unsubs.filter(Boolean).forEach(s=>s()),this.unsubs=[],this.observer.disconnect(),this.rafId!=null&&this.targetWindow&&(this.targetWindow.cancelAnimationFrame(this.rafId),this.rafId=null),this.scrollState=null,this.scrollElement=null,this.targetWindow=null},this._didMount=()=>()=>{this.cleanup()},this._willUpdate=()=>{var s;const a=this.options.enabled?this.options.getScrollElement():null;if(this.scrollElement!==a){if(this.cleanup(),!a){this.maybeNotify();return}this.scrollElement=a,this.scrollElement&&"ownerDocument"in this.scrollElement?this.targetWindow=this.scrollElement.ownerDocument.defaultView:this.targetWindow=((s=this.scrollElement)==null?void 0:s.window)??null,this.elementsCache.forEach(r=>{this.observer.observe(r)}),this.unsubs.push(this.options.observeElementRect(this,r=>{this.scrollRect=r,this.maybeNotify()})),this.unsubs.push(this.options.observeElementOffset(this,(r,n)=>{this.scrollAdjustments=0,this.scrollDirection=n?this.getScrollOffset()<r?"forward":"backward":null,this.scrollOffset=r,this.isScrolling=n,this.scrollState&&this.scheduleScrollReconcile(),this.maybeNotify()})),this._scrollToOffset(this.getScrollOffset(),{adjustments:void 0,behavior:void 0})}},this.rafId=null,this.getSize=()=>this.options.enabled?(this.scrollRect=this.scrollRect??this.options.initialRect,this.scrollRect[this.options.horizontal?"width":"height"]):(this.scrollRect=null,0),this.getScrollOffset=()=>this.options.enabled?(this.scrollOffset=this.scrollOffset??(typeof this.options.initialOffset=="function"?this.options.initialOffset():this.options.initialOffset),this.scrollOffset):(this.scrollOffset=null,0),this.getFurthestMeasurement=(s,a)=>{const r=new Map,n=new Map;for(let c=a-1;c>=0;c--){const d=s[c];if(r.has(d.lane))continue;const f=n.get(d.lane);if(f==null||d.end>f.end?n.set(d.lane,d):d.end<f.end&&r.set(d.lane,!0),r.size===this.options.lanes)break}return n.size===this.options.lanes?Array.from(n.values()).sort((c,d)=>c.end===d.end?c.index-d.index:c.end-d.end)[0]:void 0},this.getMeasurementOptions=Z(()=>[this.options.count,this.options.paddingStart,this.options.scrollMargin,this.options.getItemKey,this.options.enabled,this.options.lanes,this.options.laneAssignmentMode],(s,a,r,n,c,d,f)=>(this.prevLanes!==void 0&&this.prevLanes!==d&&(this.lanesChangedFlag=!0),this.prevLanes=d,this.pendingMeasuredCacheIndexes=[],{count:s,paddingStart:a,scrollMargin:r,getItemKey:n,enabled:c,lanes:d,laneAssignmentMode:f}),{key:!1}),this.getMeasurements=Z(()=>[this.getMeasurementOptions(),this.itemSizeCache],({count:s,paddingStart:a,scrollMargin:r,getItemKey:n,enabled:c,lanes:d,laneAssignmentMode:f},k)=>{if(!c)return this.measurementsCache=[],this.itemSizeCache.clear(),this.laneAssignments.clear(),[];if(this.laneAssignments.size>s)for(const o of this.laneAssignments.keys())o>=s&&this.laneAssignments.delete(o);this.lanesChangedFlag&&(this.lanesChangedFlag=!1,this.lanesSettling=!0,this.measurementsCache=[],this.itemSizeCache.clear(),this.laneAssignments.clear(),this.pendingMeasuredCacheIndexes=[]),this.measurementsCache.length===0&&!this.lanesSettling&&(this.measurementsCache=this.options.initialMeasurementsCache,this.measurementsCache.forEach(o=>{this.itemSizeCache.set(o.key,o.size)}));const j=this.lanesSettling?0:this.pendingMeasuredCacheIndexes.length>0?Math.min(...this.pendingMeasuredCacheIndexes):0;this.pendingMeasuredCacheIndexes=[],this.lanesSettling&&this.measurementsCache.length===s&&(this.lanesSettling=!1);const w=this.measurementsCache.slice(0,j),z=new Array(d).fill(void 0);for(let o=0;o<j;o++){const S=w[o];S&&(z[S.lane]=o)}for(let o=j;o<s;o++){const S=n(o),R=this.laneAssignments.get(o);let E,I;const D=f==="estimate"||k.has(S);if(R!==void 0&&this.options.lanes>1){E=R;const M=z[E],W=M!==void 0?w[M]:void 0;I=W?W.end+this.options.gap:a+r}else{const M=this.options.lanes===1?w[o-1]:this.getFurthestMeasurement(w,o);I=M?M.end+this.options.gap:a+r,E=M?M.lane:o%this.options.lanes,this.options.lanes>1&&D&&this.laneAssignments.set(o,E)}const F=k.get(S),te=typeof F=="number"?F:this.options.estimateSize(o),me=I+te;w[o]={index:o,start:I,size:te,end:me,key:S,lane:E},z[E]=o}return this.measurementsCache=w,w},{key:!1,debug:()=>this.options.debug}),this.calculateRange=Z(()=>[this.getMeasurements(),this.getSize(),this.getScrollOffset(),this.options.lanes],(s,a,r,n)=>this.range=s.length>0&&a>0?ns({measurements:s,outerSize:a,scrollOffset:r,lanes:n}):null,{key:!1,debug:()=>this.options.debug}),this.getVirtualIndexes=Z(()=>{let s=null,a=null;const r=this.calculateRange();return r&&(s=r.startIndex,a=r.endIndex),this.maybeNotify.updateDeps([this.isScrolling,s,a]),[this.options.rangeExtractor,this.options.overscan,this.options.count,s,a]},(s,a,r,n,c)=>n===null||c===null?[]:s({startIndex:n,endIndex:c,overscan:a,count:r}),{key:!1,debug:()=>this.options.debug}),this.indexFromElement=s=>{const a=this.options.indexAttribute,r=s.getAttribute(a);return r?parseInt(r,10):(console.warn(`Missing attribute name '${a}={index}' on measured element.`),-1)},this.shouldMeasureDuringScroll=s=>{var a;if(!this.scrollState||this.scrollState.behavior!=="smooth")return!0;const r=this.scrollState.index??((a=this.getVirtualItemForOffset(this.scrollState.lastTargetOffset))==null?void 0:a.index);if(r!==void 0&&this.range){const n=Math.max(this.options.overscan,Math.ceil((this.range.endIndex-this.range.startIndex)/2)),c=Math.max(0,r-n),d=Math.min(this.options.count-1,r+n);return s>=c&&s<=d}return!0},this.measureElement=s=>{if(!s){this.elementsCache.forEach((c,d)=>{c.isConnected||(this.observer.unobserve(c),this.elementsCache.delete(d))});return}const a=this.indexFromElement(s),r=this.options.getItemKey(a),n=this.elementsCache.get(r);n!==s&&(n&&this.observer.unobserve(n),this.observer.observe(s),this.elementsCache.set(r,s)),(!this.isScrolling||this.scrollState)&&this.shouldMeasureDuringScroll(a)&&this.resizeItem(a,this.options.measureElement(s,void 0,this))},this.resizeItem=(s,a)=>{var r;const n=this.measurementsCache[s];if(!n)return;const c=this.itemSizeCache.get(n.key)??n.size,d=a-c;d!==0&&(((r=this.scrollState)==null?void 0:r.behavior)!=="smooth"&&(this.shouldAdjustScrollPositionOnItemSizeChange!==void 0?this.shouldAdjustScrollPositionOnItemSizeChange(n,d,this):n.start<this.getScrollOffset()+this.scrollAdjustments)&&this._scrollToOffset(this.getScrollOffset(),{adjustments:this.scrollAdjustments+=d,behavior:void 0}),this.pendingMeasuredCacheIndexes.push(n.index),this.itemSizeCache=new Map(this.itemSizeCache.set(n.key,a)),this.notify(!1))},this.getVirtualItems=Z(()=>[this.getVirtualIndexes(),this.getMeasurements()],(s,a)=>{const r=[];for(let n=0,c=s.length;n<c;n++){const d=s[n],f=a[d];r.push(f)}return r},{key:!1,debug:()=>this.options.debug}),this.getVirtualItemForOffset=s=>{const a=this.getMeasurements();if(a.length!==0)return tt(a[nt(0,a.length-1,r=>tt(a[r]).start,s)])},this.getMaxScrollOffset=()=>{if(!this.scrollElement)return 0;if("scrollHeight"in this.scrollElement)return this.options.horizontal?this.scrollElement.scrollWidth-this.scrollElement.clientWidth:this.scrollElement.scrollHeight-this.scrollElement.clientHeight;{const s=this.scrollElement.document.documentElement;return this.options.horizontal?s.scrollWidth-this.scrollElement.innerWidth:s.scrollHeight-this.scrollElement.innerHeight}},this.getOffsetForAlignment=(s,a,r=0)=>{if(!this.scrollElement)return 0;const n=this.getSize(),c=this.getScrollOffset();a==="auto"&&(a=s>=c+n?"end":"start"),a==="center"?s+=(r-n)/2:a==="end"&&(s-=n);const d=this.getMaxScrollOffset();return Math.max(Math.min(d,s),0)},this.getOffsetForIndex=(s,a="auto")=>{s=Math.max(0,Math.min(s,this.options.count-1));const r=this.getSize(),n=this.getScrollOffset(),c=this.measurementsCache[s];if(!c)return;if(a==="auto")if(c.end>=n+r-this.options.scrollPaddingEnd)a="end";else if(c.start<=n+this.options.scrollPaddingStart)a="start";else return[n,a];if(a==="end"&&s===this.options.count-1)return[this.getMaxScrollOffset(),a];const d=a==="end"?c.end+this.options.scrollPaddingEnd:c.start-this.options.scrollPaddingStart;return[this.getOffsetForAlignment(d,a,c.size),a]},this.scrollToOffset=(s,{align:a="start",behavior:r="auto"}={})=>{const n=this.getOffsetForAlignment(s,a),c=this.now();this.scrollState={index:null,align:a,behavior:r,startedAt:c,lastTargetOffset:n,stableFrames:0},this._scrollToOffset(n,{adjustments:void 0,behavior:r}),this.scheduleScrollReconcile()},this.scrollToIndex=(s,{align:a="auto",behavior:r="auto"}={})=>{s=Math.max(0,Math.min(s,this.options.count-1));const n=this.getOffsetForIndex(s,a);if(!n)return;const[c,d]=n,f=this.now();this.scrollState={index:s,align:d,behavior:r,startedAt:f,lastTargetOffset:c,stableFrames:0},this._scrollToOffset(c,{adjustments:void 0,behavior:r}),this.scheduleScrollReconcile()},this.scrollBy=(s,{behavior:a="auto"}={})=>{const r=this.getScrollOffset()+s,n=this.now();this.scrollState={index:null,align:"start",behavior:a,startedAt:n,lastTargetOffset:r,stableFrames:0},this._scrollToOffset(r,{adjustments:void 0,behavior:a}),this.scheduleScrollReconcile()},this.getTotalSize=()=>{var s;const a=this.getMeasurements();let r;if(a.length===0)r=this.options.paddingStart;else if(this.options.lanes===1)r=((s=a[a.length-1])==null?void 0:s.end)??0;else{const n=Array(this.options.lanes).fill(null);let c=a.length-1;for(;c>=0&&n.some(d=>d===null);){const d=a[c];n[d.lane]===null&&(n[d.lane]=d.end),c--}r=Math.max(...n.filter(d=>d!==null))}return Math.max(r-this.options.scrollMargin+this.options.paddingEnd,0)},this._scrollToOffset=(s,{adjustments:a,behavior:r})=>{this.options.scrollToFn(s,{behavior:r,adjustments:a},this)},this.measure=()=>{this.itemSizeCache=new Map,this.laneAssignments=new Map,this.notify(!1)},this.setOptions(m)}scheduleScrollReconcile(){if(!this.targetWindow){this.scrollState=null;return}this.rafId==null&&(this.rafId=this.targetWindow.requestAnimationFrame(()=>{this.rafId=null,this.reconcileScroll()}))}reconcileScroll(){if(!this.scrollState||!this.scrollElement)return;if(this.now()-this.scrollState.startedAt>5e3){this.scrollState=null;return}const a=this.scrollState.index!=null?this.getOffsetForIndex(this.scrollState.index,this.scrollState.align):void 0,r=a?a[0]:this.scrollState.lastTargetOffset,n=1,c=r!==this.scrollState.lastTargetOffset;if(!c&&Xt(r,this.getScrollOffset())){if(this.scrollState.stableFrames++,this.scrollState.stableFrames>=n){this.scrollState=null;return}}else this.scrollState.stableFrames=0,c&&(this.scrollState.lastTargetOffset=r,this.scrollState.behavior="auto",this._scrollToOffset(r,{adjustments:void 0,behavior:"auto"}));this.scheduleScrollReconcile()}}const nt=(h,m,s,a)=>{for(;h<=m;){const r=(h+m)/2|0,n=s(r);if(n<a)h=r+1;else if(n>a)m=r-1;else return r}return h>0?h-1:0};function ns({measurements:h,outerSize:m,scrollOffset:s,lanes:a}){const r=h.length-1,n=f=>h[f].start;if(h.length<=a)return{startIndex:0,endIndex:r};let c=nt(0,r,n,s),d=c;if(a===1)for(;d<r&&h[d].end<s+m;)d++;else if(a>1){const f=Array(a).fill(0);for(;d<r&&f.some(j=>j<s+m);){const j=h[d];f[j.lane]=j.end,d++}const k=Array(a).fill(s+m);for(;c>=0&&k.some(j=>j>=s);){const j=h[c];k[j.lane]=j.start,c--}c=Math.max(0,c-c%a),d=Math.min(r,d+(a-1-d%a))}return{startIndex:c,endIndex:d}}const it=typeof document<"u"?y.useLayoutEffect:y.useEffect;function ls({useFlushSync:h=!0,...m}){const s=y.useReducer(()=>({}),{})[1],a={...m,onChange:(n,c)=>{var d;h&&c?zt.flushSync(s):s(),(d=m.onChange)==null||d.call(m,n,c)}},[r]=y.useState(()=>new is(a));return r.setOptions(a),it(()=>r._didMount(),[]),it(()=>r._willUpdate()),r}function os(h){return ls({observeElementRect:ts,observeElementOffset:ss,scrollToFn:rs,...h})}function cs(h,m,s=[]){const[a,r]=y.useState([]),[n,c]=y.useState(!0),[d,f]=y.useState(null),[k,j]=[!1,z=>z()],w=y.useRef(null);return y.useEffect(()=>{c(!0);let z=!0;return w.current=Et(h,o=>{z&&j(()=>{const S=o.docs.map(m);r(S),c(!1)})},o=>{z&&(console.error("Firestore onSnapshot error:",o),f(o),c(!1))}),()=>{z=!1,w.current&&w.current()}},s),{data:a,loading:n,error:d}}const ee={GHS01:"https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/GHS-pictogram-explos.svg/200px-GHS-pictogram-explos.svg.png",GHS02:"https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/GHS-pictogram-flamme.svg/200px-GHS-pictogram-flamme.svg.png",GHS03:"https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/GHS-pictogram-rondflam.svg/200px-GHS-pictogram-rondflam.svg.png",GHS04:"https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/GHS-pictogram-bottle.svg/200px-GHS-pictogram-bottle.svg.png",GHS05:"https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/GHS-pictogram-acid.svg/200px-GHS-pictogram-acid.svg.png",GHS06:"https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/GHS-pictogram-skull.svg/200px-GHS-pictogram-skull.svg.png",GHS07:"https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/GHS-pictogram-exclam.svg/200px-GHS-pictogram-exclam.svg.png",GHS08:"https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/GHS-pictogram-silhouette.svg/200px-GHS-pictogram-silhouette.svg.png",GHS09:"https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/GHS-pictogram-pollut.svg/200px-GHS-pictogram-pollut.svg.png"},pe={GHS01:"متفجرات",GHS02:"قابل للاشتعال",GHS03:"مؤكسد",GHS04:"غاز تحت الضغط",GHS05:"أكال / مسبب للتآكل",GHS06:"سمية حادة (قاتل)",GHS07:"تهيج / تحسس / خطر",GHS08:"خطر صحي جسيم",GHS09:"خطر بيئي"};function js({isNested:h=!1}){var Pe,qe,Ue,We,Be;const{schoolId:m,schoolName:s,directorate:a}=At(),[r]=It(),[n,c]=y.useState([]),[d,f]=y.useState(!0),[k,j]=y.useState(""),[w,z]=y.useState(r.get("filter")==="low"),[o,S]=y.useState(null),[R,E]=y.useState(!1),[I,D]=y.useState(null),F=y.useRef(null),[te,me]=y.useState(!1),[M,W]=y.useState(!1),[Oe,Te]=y.useState(!1),[lt,ue]=y.useState(!1),[$e,He]=y.useState({current:0,total:0}),[T,se]=y.useState([]),[v,_e]=y.useState(null),[ot,ae]=y.useState(!1),[O,ct]=y.useState(null),[dt,Ne]=y.useState(!1),ke=t=>{if(!t)return"غير محدد";if(!t.includes("-"))return t;const[l,i,p]=t.split("-");return!l||!i||!p?t:`${p}/${i}/${l}`},[g,C]=y.useState({nameEn:"",nameAr:"",formula:"",casNumber:"",storageTemp:"",unit:"g",quantity:0,state:"solid",hazardClass:"safe",ghs:[],shelf:"",expiryDate:"",notes:""}),{data:B,loading:Le}=cs(Dt(U(m,"chemicals")),t=>({id:t.id,...t.data()}),[m]);y.useEffect(()=>{if(!Le){c(B),f(!1);const t=r.get("id");if(t){let l=t;t.startsWith("APP_ID_")&&(l=t.split("_").slice(2,-1).join("_")),j(l);const i=B.find(p=>p.id===t||p.id===l);i?S(i):B.length>0&&!o&&S(B[0])}else B.length>0&&!o&&S(B[0])}},[B,Le,r]);const ht=async t=>{t.preventDefault();try{if(I){const{id:l}=I;await De(J(U(m,"chemicals"),l),{...g,updatedAt:de()}),await ve(m,we.UPDATE,je.CHEMICALS,`تعديل بيانات المادة: ${g.nameAr}`,l)}else{const l=await _t(U(m,"chemicals"),{...g,createdAt:de()});await ve(m,we.CREATE,je.CHEMICALS,`إضافة مادة جديدة: ${g.nameAr}`,l.id)}E(!1),D(null),C({nameEn:"",nameAr:"",formula:"",casNumber:"",storageTemp:"",unit:"g",quantity:0,state:"solid",hazardClass:"safe",ghs:[],shelf:"",expiryDate:"",notes:""})}catch(l){ye(l,I?he.UPDATE:he.CREATE,"chemicals")}},pt=async()=>{const t=g.nameEn||g.nameAr;if(!t){alert("يرجى إدخال اسم المادة أولاً (بالعربية أو الإنجليزية)");return}W(!0);try{const l=await Me(t);if(l){let i="";if(l.expiryYears>0){const p=new Date;p.setFullYear(p.getFullYear()+l.expiryYears),i=p.toISOString().split("T")[0]}C(p=>({...p,nameEn:l.nameEn||p.nameEn,nameAr:l.nameAr||p.nameAr,formula:l.formula||p.formula,casNumber:l.casNumber||p.casNumber,storageTemp:l.storageTemp||p.storageTemp,hazardClass:l.hazardClass||p.hazardClass,ghs:l.ghs||p.ghs,expiryDate:i||p.expiryDate,notes:l.notes||p.notes}))}else alert("لم نتمكن من الحصول على معلومات دقيقة لهذه المادة. يرجى إدخالها يدوياً.")}catch(l){console.error("Smart fill error:",l),alert("حدث خطأ أثناء محاولة الحصول على المعلومات الذكية.")}finally{W(!1)}},Re=async t=>{const l=t||o;if(l){W(!0);try{const i=await Me(l.nameEn||l.nameAr);i?(_e(i),t&&S(t),ae(!0)):alert("لم نتمكن من الحصول على اقتراحات تحديث لهذه المادة.")}catch(i){console.error("Smart update request error:",i),alert("حدث خطأ أثناء طلب التحديث الذكي.")}finally{W(!1)}}},mt=async()=>{if(!(!o||!v))try{let t=o.expiryDate;if(v.expiryYears>0){const l=new Date;l.setFullYear(l.getFullYear()+v.expiryYears),t=l.toISOString().split("T")[0]}await De(J(U(m,"chemicals"),o.id),{nameEn:v.nameEn,nameAr:v.nameAr,formula:v.formula,casNumber:v.casNumber,storageTemp:v.storageTemp,hazardClass:v.hazardClass,ghs:v.ghs,expiryDate:t,notes:v.notes,updatedAt:de()}),ae(!1),_e(null),alert("تم تحديث معلومات المادة بنجاح!")}catch(t){ye(t,he.UPDATE,`chemicals/${o.id}`)}},ut=async()=>{if(ue(!1),!await Lt()){alert("يرجى اختيار مفتاح API الخاص بك لاستخدام ميزة التحديث الذكي.");return}Te(!0),He({current:0,total:n.length});let l=0,i=0;for(let p=0;p<n.length;p++){const x=n[p];He({current:p+1,total:n.length});try{const u=await Me(x.nameEn||x.nameAr);if(u){let b=x.expiryDate;if(u.expiryYears>0){const _=new Date;_.setFullYear(_.getFullYear()+u.expiryYears),b=_.toISOString().split("T")[0]}await De(J(U(m,"chemicals"),x.id),{nameEn:u.nameEn||x.nameEn,nameAr:u.nameAr||x.nameAr,formula:u.formula||x.formula,casNumber:u.casNumber||x.casNumber,storageTemp:u.storageTemp||x.storageTemp,hazardClass:u.hazardClass||x.hazardClass,ghs:u.ghs||x.ghs,expiryDate:b||x.expiryDate,notes:u.notes||x.notes,updatedAt:de()}),l++}else i++}catch(u){console.error(`Error updating chemical ${x.nameEn}:`,u),i++;const b=(u==null?void 0:u.message)||String(u);if(b.includes("quota")||b.includes("RESOURCE_EXHAUSTED")){alert("تم إيقاف التحديث التلقائي بسبب تجاوز حصة الاستخدام المسموح بها (Quota Exceeded). يرجى المحاولة لاحقاً أو التحقق من حساب Gemini API الخاص بك.");break}}await new Promise(u=>setTimeout(u,5e3))}Te(!1),alert(`اكتمل التحديث الذكي!
تم تحديث: ${l} مادة بنجاح
فشل: ${i} مادة`)},xt=async(t,l)=>{try{await Rt(J(U(m,"chemicals"),t)),await ve(m,we.DELETE,je.CHEMICALS,`حذف المادة: ${l}`,t),(o==null?void 0:o.id)===t&&S(n.find(i=>i.id!==t)||null)}catch(i){ye(i,he.DELETE,`chemicals/${t}`)}},ft=()=>{const t=window.open("","_blank");if(!t){alert("يرجى السماح بالنوافذ المنبثقة لطباعة القائمة");return}const l=Q.filter(b=>b.ghs&&b.ghs.length>0||b.hazardClass==="danger").length,p=new Date().toLocaleDateString("ar-DZ",{day:"2-digit",month:"2-digit",year:"numeric"}),x="2025/2026",u=Q.map((b,_)=>{const re=b.ghs&&b.ghs.length>0||b.hazardClass==="danger",ie=(b.ghs||[]).map(P=>`<div class="ghs-pic"><img src="${ee[P]}" alt="${P}" /></div>`).join("");return`
        <tr class="${re?"hazardous-row":""}">
          <td class="text-center">${_+1}</td>
          <td class="font-bold text-lg">${b.nameAr}</td>
          <td class="text-sm en-font">${b.nameEn}</td>
          <td class="mono-font">${b.formula||"—"}</td>
          <td class="text-center">${b.unit}</td>
          <td class="text-center font-bold">${b.quantity}</td>
          <td class="text-center">${b.state==="solid"?"صلب":b.state==="liquid"?"سائل":"غاز"}</td>
          <td class="text-center">${b.shelf||"—"}</td>
          <td><div class="ghs-container">${ie}</div></td>
          <td class="notes-cell">${b.notes||"—"}</td>
        </tr>
      `}).join("");t.document.write(`
      <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <title>سجل المواد الكيميائية — ${s}</title>
          <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet">
          <style>
            :root {
              --primary: #006494;
              --on-primary: #ffffff;
              --primary-container: #cbe6ff;
              --secondary: #50606e;
              --surface: #fdfcff;
              --surface-variant: #dee3eb;
              --outline: #71787e;
              --error: #ba1a1a;
            }

            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { 
              font-family: 'Cairo', sans-serif; 
              direction: rtl; 
              background: #f8f9fb; 
              color: #1a1c1e;
              padding: 20px;
            }

            #toolbar {
              position: fixed; top: 0; left: 0; right: 0; 
              z-index: 100; background: #1a1c1e; color: white;
              padding: 12px 24px; display: flex; align-items: center; gap: 15px;
              box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            }
            #toolbar h3 { flex: 1; font-weight: 800; font-size: 16px; }
            .tb-btn { 
              padding: 10px 20px; border: none; border-radius: 20px; 
              cursor: pointer; font-weight: 700; font-size: 13px; font-family: Cairo;
              transition: all 0.2s;
            }
            .tb-print { background: #00b894; color: white; }
            .tb-close { background: #e74c3c; color: white; }

            .page-sheet {
              background: white;
              width: 297mm;
              min-height: 210mm;
              margin: 60px auto 20px;
              padding: 15mm;
              box-shadow: 0 10px 30px rgba(0,0,0,0.1);
              display: flex;
              flex-direction: column;
            }

            /* --- Header Layout --- */
            .official-header {
              display: grid;
              grid-template-columns: 1fr 2fr 1fr;
              margin-bottom: 20px;
              padding-bottom: 15px;
              border-bottom: 2px solid var(--primary);
              align-items: start;
            }
            .oh-right { text-align: right; line-height: 1.6; font-size: 10pt; }
            .oh-center { text-align: center; line-height: 1.5; font-size: 11pt; font-weight: 800; }
            .oh-left { text-align: left; line-height: 1.6; font-size: 10pt; }
            .oh-center img { height: 50px; margin-bottom: 5px; }

            .main-title {
              text-align: center;
              font-size: 22pt;
              font-weight: 900;
              color: var(--primary);
              margin: 10px 0;
              letter-spacing: -0.5px;
              text-shadow: 1px 1px 0 rgba(0,0,0,0.05);
            }

            .registry-meta {
              display: flex;
              justify-content: center;
              gap: 30px;
              margin-bottom: 20px;
              padding: 10px;
              background: var(--primary-container);
              border-radius: 12px;
              font-weight: 700;
              color: var(--on-primary-container);
            }

            /* --- Table Design --- */
            .registry-table {
              width: 100%;
              border-collapse: separate;
              border-spacing: 0;
              font-size: 10pt;
              margin-bottom: 20px;
            }
            .registry-table th {
              background: #f0f4f8;
              color: var(--secondary);
              font-weight: 800;
              padding: 12px 8px;
              border: 1px solid #d1d5db;
              text-align: center;
              font-size: 9pt;
            }
            .registry-table td {
              padding: 10px 8px;
              border: 1px solid #e5e7eb;
              line-height: 1.4;
            }
            .registry-table tr:nth-child(even) { background: #fafbfc; }
            .hazardous-row { background-color: #fff1f2 !important; }
            .hazardous-row td:first-child { border-right: 4px solid var(--error); }

            .text-center { text-align: center; }
            .font-bold { font-weight: 800; }
            .mono-font { font-family: 'JetBrains Mono', monospace; font-size: 9pt; }
            .en-font { font-family: sans-serif; color: var(--secondary); }
            .notes-cell { font-size: 9pt; color: #444; font-style: italic; }

            .ghs-container { display: flex; gap: 4px; justify-content: center; flex-wrap: wrap; }
            .ghs-pic { 
              width: 32px; height: 32px; border: 1px solid #ddd; 
              border-radius: 4px; background: white; padding: 2px;
              display: flex; align-items: center; justify-content: center;
            }
            .ghs-pic img { width: 100%; height: 100%; object-fit: contain; }

            /* --- Footer --- */
            .registry-footer {
              margin-top: auto;
              padding-top: 30px;
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 20px;
            }
            .sign-box {
              text-align: center;
              border: 1px solid #eee;
              padding: 15px;
              border-radius: 12px;
              background: #fafafa;
            }
            .sign-box h4 { margin-bottom: 50px; font-weight: 800; text-decoration: underline; color: var(--secondary); }
            
            .inst-stamp {
              width: 40mm;
              height: 25mm;
              border: 2px dashed #ccc;
              border-radius: 12px;
              margin: 10px auto;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 8pt;
              color: #999;
            }

            @media print {
              #toolbar { display: none !important; }
              body { background: white !important; padding: 0 !important; }
              .page-sheet { 
                margin: 0 !important; box-shadow: none !important; 
                width: 100% !important; padding: 10mm !important;
                border-radius: 0 !important;
              }
              @page { size: A4 landscape; margin: 0; }
              .registry-table th { background: #eee !important; -webkit-print-color-adjust: exact; }
              .hazardous-row { background-color: #fff1f1 !important; -webkit-print-color-adjust: exact; }
              .registry-meta { background: #eee !important; color: black !important; -webkit-print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <div id="toolbar">
              <h3>📄 جرد المواد الكيميائية — سجل المخبر</h3>
              <button class="tb-btn tb-print" onclick="window.print()">🖨️ طباعة السجل</button>
              <button class="tb-btn tb-close" onclick="window.close()">✕ إغلاق</button>
          </div>

          <div class="page-sheet">
            <header class="official-header">
              <div class="oh-right">
                <div>وزارة التربية الوطنية</div>
                <div>مديرية التربية لولاية: ${a}</div>
                <div>المؤسسة: ${s}</div>
              </div>
              <div class="oh-center">
                <p>الجمهورية الجزائرية الديمقراطية الشعبية</p>
                <div class="main-title">سجل جرد المواد الكيميائية للمخبر</div>
              </div>
              <div class="oh-left">
                <div>السنة الدراسية: ${x}</div>
                <div>تاريخ الطباعة: ${p}</div>
                <div class="inst-stamp">ختم المؤسسة</div>
              </div>
            </header>

            <div class="registry-meta">
              <span>إجمالي المواد: ${Q.length}</span>
              <span style="border-right: 2px solid rgba(0,0,0,0.1); padding-right: 20px;">المواد الخطرة: ${l}</span>
            </div>

            <table class="registry-table">
              <thead>
                <tr>
                  <th width="40">رقم</th>
                  <th>الاسم العربي للمادة</th>
                  <th>Désignation (En)</th>
                  <th width="120">الصيغة</th>
                  <th width="60">الوحدة</th>
                  <th width="60">الكمية</th>
                  <th width="70">الحالة</th>
                  <th width="60">الرف</th>
                  <th width="100">GHS Pictograms</th>
                  <th>ملاحظات إضافية</th>
                </tr>
              </thead>
              <tbody>
                ${u}
              </tbody>
            </table>

            <footer class="registry-footer">
              <div class="sign-box"><h4>المخبري الرئيسي</h4></div>
              <div class="sign-box"><h4>المقتصد</h4></div>
              <div class="sign-box"><h4>مدير المؤسسة</h4></div>
              <div class="sign-box"><h4>مفتش التربية الوطنية</h4></div>
            </footer>
          </div>
        </body>
      </html>
    `),t.document.close()},gt=async()=>{const t=["#","الاسم العلمي","الاسم العربي","الصيغة","الكمية","الرف","تاريخ الصلاحية"],l=$.map((i,p)=>[p+1,i.nameEn||"",i.nameAr||"",i.formula||"",`${i.quantity} ${i.unit}`,i.shelf||"",ke(i.expiryDate)]);await Pt.generateTablePDF("تقرير جرد المواد الكيميائية",t,l,`chemicals_inventory_${new Date().toISOString().split("T")[0]}.pdf`)},bt=()=>{const t=K.json_to_sheet($.map(i=>({"الاسم (EN)":i.nameEn,"الاسم (AR)":i.nameAr,الصيغة:i.formula,"رقم CAS":i.casNumber,الكمية:i.quantity,الوحدة:i.unit,الحالة:i.state,الخطورة:i.hazardClass,الرف:i.shelf,"تاريخ الصلاحية":i.expiryDate,ملاحظات:i.notes}))),l=K.book_new();K.book_append_sheet(l,t,"Inventory"),Ke(l,`chemical_inventory_${new Date().toISOString().split("T")[0]}.xlsx`)},yt=async t=>{var p;const l=(p=t.target.files)==null?void 0:p[0];if(!l)return;me(!0);const i=new FileReader;i.onload=async x=>{var u;try{const b=(u=x.target)==null?void 0:u.result,_=Ft(b,{type:"binary",cellDates:!0}),re=_.SheetNames[0],ie=_.Sheets[re],P=K.sheet_to_json(ie),xe=N=>{if(!N)return"";if(N instanceof Date)return N.toISOString().split("T")[0];const X=new Date(N);return isNaN(X.getTime())?String(N).trim():X.toISOString().split("T")[0]},L=(N,X)=>{const Ce=Object.keys(N);for(const ne of X){const le=Ce.find(q=>q.toLowerCase().trim()===ne.toLowerCase().trim());if(le)return N[le]}},Ve=Xe(Je);P.forEach(N=>{const X=L(N,["PRODUIT CHIMIQUE","Name","nameEn","Product","Chemical"])||"Unnamed Chemical",Ce=L(N,["الاسم العربي","الاسم","Arabic Name","nameAr","Arabic"])||"",ne=L(N,["الكمية","Quantity","quantity","Qty","Amount"]),le=typeof ne=="number"?ne:parseFloat(String(ne||"0").replace(/[^0-9.]/g,""));let q=String(L(N,["الحالة","State","state","Status"])||"solid").trim(),fe="solid";q==="صلب"||q.toLowerCase()==="solid"?fe="solid":q==="سائل"||q.toLowerCase()==="liquid"?fe="liquid":(q==="غاز"||q.toLowerCase()==="gas")&&(fe="gas");let ge=String(L(N,["الخطورة","Hazard","hazardClass","Danger"])||"safe").trim(),ze="safe";ge==="خطر"||ge.toLowerCase()==="danger"?ze="danger":(ge==="آمن"||ge.toLowerCase()==="safe")&&(ze="safe");const kt=J(U(m,"chemicals"));Ve.set(kt,{nameEn:String(X).trim(),nameAr:String(Ce).trim(),formula:L(N,["الصيغة","Formula","formula"])||"",unit:L(N,["الوحدة","Unit","unit"])||"g",quantity:isNaN(le)?0:le,state:fe,hazardClass:ze,ghs:Array.isArray(N.GHS)?N.GHS:N.GHS?String(N.GHS).split(",").map(St=>St.trim()):[],shelf:L(N,["الرف","Shelf","shelf"])||"",expiryDate:xe(L(N,["الصلاحية","Expiry","تاريخ الانتهاء","expiryDate"])),notes:L(N,["ملاحظات","Notes","notes"])||"",createdAt:de()})}),await Ve.commit(),alert(`تم استيراد ${P.length} مادة بنجاح!`)}catch(b){console.error("Error importing XLS:",b),alert("حدث خطأ أثناء استيراد الملف. يرجى التأكد من صيغة الملف.")}finally{me(!1),F.current&&(F.current.value="")}},i.readAsBinaryString(l)},Se=t=>{const l=window.open("","_blank");if(!l){alert("يرجى السماح بالنوافذ المنبثقة لطباعة البطاقات");return}const i=new Date,p="2025/2026",x=t.map((u,b)=>{var P,xe;const _=u.state==="solid"?"صلب":u.state==="liquid"?"سائل":"غاز",re=u.hazardClass==="danger"?(P=u.ghs)!=null&&P[0]?pe[u.ghs[0]]:"خطر":"آمن",ie=(xe=u.ghs)!=null&&xe[0]?"☠️":"—";return`
        <div class="pcard">
          <div class="ph-container">
            <div class="ph">
              <div class="ph-r">مديرية التربية لولاية: ${a}<br>ثانوية: ${s}</div>
              <div class="ph-c">الجمهورية الجزائرية الديمقراطية الشعبية<br>وزارة التربية الوطنية</div>
              <div class="ph-l">
                <div>السنة الدراسية: ${p}</div>
                <div class="header-stamp">ختم المؤسسة</div>
              </div>
            </div>
          </div>

          <div class="pcard-badge">رقم البطاقة: ${b+1}</div>
          <h1 class="pcard-title">بطاقة مخزون مادة كيميائية</h1>
          
          <div class="ic-meta-expressive">
             <div class="ic-field main">
                <span class="l">اسم المادة (AR)</span>
                <span class="v">${u.nameAr}</span>
             </div>
             <div class="ic-field sub">
                <span class="l">NOM DU PRODUIT</span>
                <span class="v en">${u.nameEn}</span>
             </div>
          </div>

          <div class="ic-grid-info">
             <div class="ic-info-box">
                <span class="l">الصيغة</span>
                <span class="v en-bold">${u.formula||"—"}</span>
             </div>
             <div class="ic-info-box">
                <span class="l">الحالة</span>
                <span class="v">${_}</span>
             </div>
             <div class="ic-info-box">
                <span class="l">الرف</span>
                <span class="v">${u.shelf||"—"}</span>
             </div>
             <div class="ic-info-box danger">
                <span class="l">GHS</span>
                <span class="v emoji">${ie}</span>
             </div>
          </div>

          <div class="ic-safety-strip">
             <b>طبيعة الخطورة:</b> ${re} 
             <span style="margin-right: 15px">|</span> 
             <b>وحدة القياس:</b> ${u.unit}
          </div>

          <div class="ic-table-container">
            <table class="ic-tbl">
              <thead>
                <tr>
                  <th rowspan="2" width="12%">التاريخ</th>
                  <th colspan="2">سند الطلب</th>
                  <th rowspan="2">المصدر</th>
                  <th rowspan="2" width="10%">الثمن</th>
                  <th colspan="3">الكمية</th>
                  <th rowspan="2">ملاحظات</th>
                </tr>
                <tr><th>خروج</th><th>دخول</th><th>خروج</th><th>دخول</th><th>المخزون</th></tr>
              </thead>
              <tbody>
                <tr class="initial-stock">
                  <td>${i.toLocaleDateString("en-GB")}</td>
                  <td>-</td><td>-</td>
                  <td>رصيد أول المدة</td>
                  <td>-</td>
                  <td>-</td><td>${u.quantity}</td><td>${u.quantity}</td>
                  <td>رصيد ابتدائي</td>
                </tr>
                ${Array(14).fill("<tr><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>").join("")}
                <tr class="carry-over">
                  <td colspan="5">الرصيد المنقول لظهر البطاقة</td>
                  <td></td><td></td><td class="bold">..........</td>
                  <td>ينقل ←</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="pcard back">
          <div class="back-header">
             <span>تتمة حركة المخزون — ${u.nameAr}</span>
             <span class="ref">REF: ${b+1}</span>
          </div>

          <div class="ic-table-container">
            <table class="ic-tbl">
              <thead>
                <tr>
                  <th rowspan="2" width="12%">التاريخ</th>
                  <th colspan="2">سند الطلب</th>
                  <th rowspan="2">المصدر</th>
                  <th rowspan="2" width="10%">الثمن</th>
                  <th colspan="3">الكمية</th>
                  <th rowspan="2">ملاحظات</th>
                </tr>
                <tr><th>خروج</th><th>دخول</th><th>خروج</th><th>دخول</th><th>المخزون</th></tr>
              </thead>
              <tbody>
                <tr class="initial-stock">
                  <td colspan="5">المجموع المنقول من وجه البطاقة</td>
                  <td></td><td></td><td>..........</td>
                  <td>نقل ←</td>
                </tr>
                ${Array(22).fill("<tr><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>").join("")}
              </tbody>
            </table>
          </div>

          <div class="ic-safety-rules">
             <h3>⚠️ تعليمات السلامة الخاصة بالتخزين</h3>
             <div class="rules-box">
                ${u.notes||"يجب حفظ هذه المادة في ظروف ملائمة بعيداً عن الرطوبة والحرارة ووفق معايير السلامة المنصوص عليها في دليل المختبرات."}
             </div>
          </div>
        </div>
      `}).join("");l.document.write(`
      <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <title>بطاقة مخزون</title>
          <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet">
          <style>
            :root {
              --primary: #006494;
              --on-primary: #ffffff;
              --primary-container: #cbe6ff;
              --on-primary-container: #001e30;
              --secondary: #50606e;
              --tertiary: #65587b;
              --error: #ba1a1a;
              --outline: #71787e;
              --surface: #fdfcff;
              --surface-variant: #dee3eb;
            }

            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { 
              font-family: 'Cairo', sans-serif; 
              direction: rtl; 
              background: #f0f2f5; 
              color: #1a1c1e;
              padding: 20px;
            }

            #toolbar {
              position: fixed; top: 0; left: 0; right: 0; 
              z-index: 100; background: #1a1c1e; color: white;
              padding: 12px 24px; display: flex; align-items: center; gap: 15px;
              box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            }
            #toolbar h3 { flex: 1; font-weight: 800; font-size: 16px; }
            .tb-btn { 
              padding: 10px 20px; border: none; border-radius: 20px; 
              cursor: pointer; font-weight: 700; font-size: 13px; font-family: Cairo;
              transition: all 0.2s;
            }
            .tb-print { background: #00b894; color: white; }
            .tb-close { background: #e74c3c; color: white; }

            #body { padding-top: 60px; max-width: 900px; margin: 0 auto; }

            .pcard {
              background: white;
              width: 148mm;
              height: 210mm;
              margin: 20px auto;
              padding: 8mm;
              border-radius: 24px;
              box-shadow: 0 10px 25px rgba(0,0,0,0.08);
              display: flex;
              flex-direction: column;
              border: 1px solid rgba(0,0,0,0.05);
              position: relative;
              overflow: hidden;
            }

            .pcard.back { border-style: dashed; }

            .ph-container {
              background: var(--surface-variant);
              margin: -8mm -8mm 4mm -8mm;
              padding: 6mm 8mm;
              border-radius: 0 0 24px 24px;
            }
            .ph {
              display: grid; grid-template-columns: 1fr 1.5fr 1fr;
              font-size: 7.5pt; gap: 4px; align-items: start; color: var(--secondary);
            }
            .ph-r { text-align: right; line-height: 1.5; }
            .ph-c { text-align: center; font-weight: 800; line-height: 1.5; }
            .ph-l { text-align: left; line-height: 1.5; }

            .header-stamp {
              margin-top: 5px;
              width: 35mm;
              height: 20mm;
              border: 1px dashed var(--outline);
              border-radius: 8px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 6pt;
              color: var(--outline);
              font-weight: 400;
            }

            .pcard-badge {
              position: absolute; top: 12mm; left: 8mm;
              background: var(--primary-container); color: var(--on-primary-container);
              padding: 2px 12px; border-radius: 12px; font-size: 8pt; font-weight: 700;
            }

            .pcard-title {
              text-align: center; font-size: 14pt; font-weight: 900;
              color: var(--primary); margin: 4mm 0;
            }

            .ic-meta-expressive { display: flex; flex-direction: column; gap: 4px; margin-bottom: 6mm; }
            .ic-field { border-radius: 12px; padding: 6px 12px; display: flex; align-items: center; justify-content: space-between; }
            .ic-field.main { background: #f0f4f9; border-right: 4px solid var(--primary); }
            .ic-field.sub { background: #fafbfc; border-right: 4px solid var(--outline); font-size: 9pt; }
            .ic-field .l { font-weight: 700; color: var(--secondary); font-size: 8.5pt; }
            .ic-field .v { font-weight: 800; font-size: 11pt; }
            .ic-field .v.en { font-family: sans-serif; font-size: 9pt; text-transform: uppercase; }

            .ic-grid-info { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin-bottom: 6mm; }
            .ic-info-box { background: #fff; border: 1px solid var(--surface-variant); border-radius: 12px; padding: 6px; text-align: center; }
            .ic-info-box .l { display: block; font-size: 7pt; font-weight: 700; color: var(--tertiary); margin-bottom: 2px; }
            .ic-info-box .v { font-weight: 800; font-size: 9.5pt; }
            .ic-info-box .v.en-bold { font-family: monospace; font-weight: 900; font-size: 10pt; }
            .ic-info-box.danger { border-color: var(--error); background: #fff8f8; }

            .ic-safety-strip { background: var(--on-primary-container); color: white; border-radius: 8px; padding: 5px 12px; font-size: 8.5pt; margin-bottom: 6mm; }

            .ic-table-container { flex: 1; margin-bottom: 4mm; }
            .ic-tbl { width: 100%; border-collapse: collapse; font-size: 8pt; table-layout: fixed; }
            .ic-tbl th, .ic-tbl td { border: 0.5pt solid var(--surface-variant); padding: 4px; text-align: center; }
            .ic-tbl th { background: #e8ecef; color: var(--secondary); font-weight: 800; font-size: 7pt; }
            .ic-tbl td { height: 6mm; }
            tr.initial-stock { background: #f0fdf4; font-weight: 600; }
            .bold { font-weight: 900; }

            .back-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid var(--primary); padding-bottom: 5px; margin-bottom: 6mm; font-weight: 900; font-size: 11pt; color: var(--primary); }
            .rules-box { background: #fffafa; border: 1px solid #ffeded; padding: 10px; border-radius: 12px; font-size: 8.5pt; color: #444; line-height: 1.6; }

            @media print {
              #toolbar { display: none !important; }
              body { background: white !important; padding: 0 !important; }
              @page { size: A5 portrait; margin: 3mm; }
              .pcard {
                width: 100% !important; height: calc(210mm - 6mm) !important;
                margin: 0 !important; border: 1px solid #000 !important;
                border-radius: 0 !important; box-shadow: none !important;
                page-break-after: always !important; padding: 5mm !important;
              }
              .ph-container { border-radius: 0 !important; margin-bottom: 2mm !important; }
              .ic-meta-expressive .ic-field { background: white !important; border: 1px solid #eee !important; box-shadow: none !important; }
              .ic-tbl th { background: #f0f0f0 !important; border: 0.5pt solid #000 !important; print-color-adjust: exact; }
              .ic-tbl td { border: 0.5pt solid #000 !important; }
            }
          </style>
        </head>
        <body>
          <div id="toolbar">
              <h3>🎨 جرد كيميائي — ${t.length} عنصر</h3>
              <button class="tb-btn tb-print" onclick="window.print()">🖨️ بدء الطباعة</button>
              <button class="tb-btn tb-close" onclick="window.close()">✕ إغلاق المعاينة</button>
          </div>
          <div id="body">
            ${x}
          </div>
        </body>
      </html>
    `),l.document.close()},vt=t=>{const l=window.open("","_blank");l&&(l.document.write(`
      <html dir="rtl">
        <head>
          <title>بطاقة مادة - ${t.nameEn}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; }
            .header { text-align: center; border-bottom: 2px solid #2b3d22; padding-bottom: 20px; margin-bottom: 30px; }
            .title { font-size: 24px; font-weight: bold; color: #2b3d22; }
            .details { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
            .item { border-bottom: 1px solid #eee; padding: 10px 0; }
            .label { font-weight: bold; color: #5c6146; }
            .hazard { color: #e11d48; font-weight: bold; }
            .footer { margin-top: 50px; text-align: left; font-size: 12px; color: #999; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">بطاقة تعريف مادة كيميائية</div>
            <div>نظام تسيير المخابر المدرسية</div>
          </div>
          <div class="details">
            <div class="item"><span class="label">PRODUIT CHIMIQUE:</span> ${t.nameEn}</div>
            <div class="item"><span class="label">الاسم العربي:</span> ${t.nameAr}</div>
            <div class="item"><span class="label">الصيغة الكيميائية:</span> ${t.formula}</div>
            <div class="item"><span class="label">رقم CAS:</span> ${t.casNumber||"غير متوفر"}</div>
            <div class="item"><span class="label">درجة التخزين:</span> ${t.storageTemp||"غير متوفر"}</div>
            <div class="item"><span class="label">الحالة:</span> ${t.state}</div>
            <div class="item"><span class="label">الكمية الحالية:</span> ${t.quantity} ${t.unit}</div>
            <div class="item"><span class="label">الرف:</span> ${t.shelf}</div>
            <div class="item"><span class="label">الصلاحية:</span> ${t.expiryDate||"غير محدد"}</div>
            <div class="item" style="grid-column: span 2;">
              <span class="label">رموز السلامة GHS:</span>
              <div style="display: flex; flex-wrap: wrap; gap: 10px; margin-top: 10px;">
                ${(t.ghs||[]).map(i=>`
                  <div style="display: flex; flex-direction: column; align-items: center; border: 1px solid #ccc; padding: 5px; border-radius: 8px; width: 70px; background: #fff;">
                    <img src="${ee[i]}" style="width: 40px; height: 40px;" />
                    <span style="font-size: 9px; margin-top: 4px; text-align: center; font-weight: bold;">${pe[i]||i}</span>
                  </div>
                `).join("")}
              </div>
            </div>
            <div class="item"><span class="label">تصنيف الخطورة:</span> <span class="${t.hazardClass==="danger"?"hazard":""}">${t.hazardClass==="danger"?"خطر":"آمن"}</span></div>
            <div class="item" style="grid-column: span 2;"><span class="label">ملاحظات:</span> ${t.notes||"لا توجد"}</div>
          </div>
          <div class="footer">طبع بتاريخ: ${new Date().toLocaleString("ar-DZ")}</div>
          <script>window.print();<\/script>
        </body>
      </html>
    `),l.document.close())},V=t=>{let l="asc";O&&O.key===t&&O.direction==="asc"&&(l="desc"),ct({key:t,direction:l})},wt=t=>{se(l=>l.includes(t)?l.filter(i=>i!==t):[...l,t])},jt=()=>{T.length===$.length?se([]):se($.map(t=>t.id))},Nt=async()=>{if(window.confirm(`هل أنت متأكد من حذف ${T.length} مادة؟`))try{const t=Xe(Je);T.forEach(l=>{t.delete(J(U(m,"chemicals"),l))}),await t.commit(),await ve(m,we.DELETE,je.CHEMICALS,`حذف جماعي لـ ${T.length} مادة`),se([]),alert("تم الحذف بنجاح!")}catch(t){ye(t,he.DELETE,"chemicals/bulk")}},$=n.filter(t=>{var p,x,u;const l=((p=t.nameEn)==null?void 0:p.toLowerCase().includes(k.toLowerCase()))||((x=t.nameAr)==null?void 0:x.toLowerCase().includes(k.toLowerCase()))||((u=t.formula)==null?void 0:u.toLowerCase().includes(k.toLowerCase())),i=!w||t.quantity<10;return l&&i}),Q=Mt.useMemo(()=>{const t=[...$];return O!==null&&t.sort((l,i)=>{const p=l[O.key],x=i[O.key];return p===void 0||x===void 0?0:p<x?O.direction==="asc"?-1:1:p>x?O.direction==="asc"?1:-1:0}),t},[$,O]),Y=t=>(O==null?void 0:O.key)===t?O.direction==="asc"?e.jsx(Qt,{size:14,className:"mr-1"}):e.jsx(Gt,{size:14,className:"mr-1"}):e.jsx("div",{className:"w-[14px] mr-1"}),Fe=n.filter(t=>t.quantity<10).length,Ge=y.useRef(null),H=os({count:Q.length,getScrollElement:()=>Ge.current,estimateSize:()=>72,overscan:10});return e.jsxs("div",{className:A("space-y-10 max-w-7xl mx-auto pb-20",!h&&"px-4"),children:[!h&&e.jsxs("header",{className:"flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-4",children:[e.jsxs("div",{className:"text-right space-y-1",children:[e.jsx("h1",{className:"text-4xl font-black text-primary tracking-tighter",children:"المخزن الكيميائي"}),e.jsx("p",{className:"text-secondary/80 text-base font-medium",children:"إدارة وتتبع المحاليل والكواشف الكيميائية"})]}),e.jsxs("div",{className:"flex flex-wrap gap-3",children:[e.jsx("input",{type:"file",ref:F,onChange:yt,className:"hidden",accept:".xls,.xlsx"}),e.jsxs("button",{onClick:()=>Ne(!0),className:"bg-surface text-secondary border border-outline/10 px-6 py-3.5 rounded-full flex items-center gap-2 font-bold hover:bg-surface-container-high transition-all active:scale-95 shadow-sm",children:[e.jsx(Qe,{size:20}),"مسح QR"]}),e.jsxs("button",{onClick:ft,className:"bg-surface text-secondary border border-outline/10 px-6 py-3.5 rounded-full flex items-center gap-2 font-bold hover:bg-surface-container-high transition-all active:scale-95 shadow-sm",children:[e.jsx(be,{size:20}),"طباعة القائمة"]}),e.jsxs("button",{onClick:()=>Se(Q),className:"bg-surface text-secondary border border-outline/10 px-6 py-3.5 rounded-full flex items-center gap-2 font-bold hover:bg-surface-container-high transition-all active:scale-95 shadow-sm",children:[e.jsx(be,{size:20,className:"text-primary"}),"طباعة بطاقات المخزون"]}),e.jsxs("button",{onClick:gt,className:"bg-surface text-secondary border border-outline/10 px-6 py-3.5 rounded-full flex items-center gap-2 font-bold hover:bg-surface-container-high transition-all active:scale-95 shadow-sm",children:[e.jsx(Ye,{size:20}),"تصدير PDF"]}),e.jsxs("button",{onClick:()=>{var t;return(t=F.current)==null?void 0:t.click()},disabled:te,className:"bg-surface text-secondary border border-outline/10 px-6 py-3.5 rounded-full flex items-center gap-2 font-bold hover:bg-surface-container-high transition-all active:scale-95 shadow-sm disabled:opacity-50",children:[te?e.jsx("div",{className:"w-5 h-5 border-2 border-secondary/30 border-t-secondary rounded-full animate-spin"}):e.jsx(Ot,{size:20}),"استيراد XLS"]}),e.jsxs("button",{onClick:bt,className:"bg-surface text-secondary border border-outline/10 px-6 py-3.5 rounded-full flex items-center gap-2 font-bold hover:bg-surface-container-high transition-all active:scale-95 shadow-sm",children:[e.jsx(Ze,{size:20}),"تصدير الجرد"]}),e.jsxs("button",{onClick:()=>ue(!0),disabled:Oe||n.length===0,className:"bg-primary text-on-primary px-6 py-3.5 rounded-full flex items-center gap-2 font-bold hover:bg-primary/90 transition-all active:scale-95 shadow-lg shadow-primary/20 disabled:opacity-50",title:"تحديث ذكي لجميع المواد في القائمة",children:[Oe?e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("div",{className:"w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"}),e.jsxs("span",{className:"text-xs",children:[$e.current,"/",$e.total]})]}):e.jsx(oe,{size:20}),"تحديث ذكي للكل"]}),e.jsxs("button",{onClick:()=>E(!0),className:"bg-primary text-on-primary px-8 py-3.5 rounded-full flex items-center gap-2 font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95",children:[e.jsx(Ut,{size:20}),"إضافة مادة"]})]})]}),!h&&e.jsxs("section",{className:"grid grid-cols-1 md:grid-cols-4 gap-6",children:[e.jsxs("div",{className:"bg-surface-container-low p-7 rounded-[32px] border border-outline/5 hover:border-outline/20 transition-all group",children:[e.jsx("p",{className:"text-xs text-secondary/60 font-black uppercase tracking-widest mb-3",children:"إجمالي المواد"}),e.jsx("h3",{className:"text-4xl font-black text-primary group-hover:scale-110 transition-transform origin-right",children:n.length})]}),e.jsxs("div",{className:"bg-error-container/40 p-7 rounded-[32px] border border-error/10 hover:border-error/20 transition-all group",children:[e.jsx("p",{className:"text-xs text-on-error-container/60 font-black uppercase tracking-widest mb-3",children:"مواد خطرة"}),e.jsx("h3",{className:"text-4xl font-black text-error group-hover:scale-110 transition-transform origin-right",children:n.filter(t=>t.ghs&&t.ghs.length>0||t.hazardClass==="danger").length})]}),e.jsxs("div",{className:"bg-tertiary-fixed/40 p-7 rounded-[32px] border border-tertiary/10 hover:border-tertiary/20 transition-all group",children:[e.jsx("p",{className:"text-xs text-on-tertiary-fixed/60 font-black uppercase tracking-widest mb-3",children:"تنتهي قريباً"}),e.jsx("h3",{className:"text-4xl font-black text-tertiary group-hover:scale-110 transition-transform origin-right",children:n.filter(t=>{if(!t.expiryDate)return!1;const l=new Date(t.expiryDate),i=new Date;return i.setMonth(i.getMonth()+3),l<i&&l>new Date}).length.toString().padStart(2,"0")})]}),e.jsxs("div",{className:"bg-primary p-7 rounded-[32px] text-on-primary shadow-xl shadow-primary/20 hover:shadow-2xl transition-all group relative overflow-hidden",children:[e.jsx("div",{className:"absolute top-0 right-0 w-24 h-24 bg-surface/10 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700"}),e.jsxs("div",{className:"relative z-10",children:[e.jsx("p",{className:"text-white/60 text-xs font-black uppercase tracking-widest mb-3",children:"سعة التخزين"}),e.jsx("h3",{className:"text-4xl font-black",children:"68%"})]})]})]}),Fe>0&&e.jsxs(G.div,{initial:{opacity:0,y:-20},animate:{opacity:1,y:0},className:"bg-error-container/30 backdrop-blur-sm text-on-error-container p-5 rounded-[32px] flex items-center justify-between border border-error/10 shadow-lg shadow-error/5",children:[e.jsxs("div",{className:"flex items-center gap-4 text-error",children:[e.jsx("div",{className:"bg-error p-3 rounded-2xl text-white shadow-lg shadow-error/20",children:e.jsx(Tt,{size:20})}),e.jsxs("span",{className:"font-black text-base",children:["تنبيه: يوجد ",Fe," مواد منخفضة المخزون!"]})]}),e.jsx("button",{onClick:()=>z(!w),className:"text-sm font-black underline underline-offset-4 text-error px-6 py-2.5 hover:bg-error/10 rounded-full transition-all active:scale-95",children:w?"عرض الكل":"عرض المواد المنخفضة"})]}),e.jsxs("div",{className:"grid grid-cols-1 lg:grid-cols-12 gap-10",children:[e.jsx("div",{className:"lg:col-span-8 space-y-8",children:e.jsxs("div",{className:"bg-surface-container-lowest rounded-[32px] overflow-hidden border border-outline/10 shadow-sm",children:[e.jsxs("div",{className:"p-8 flex flex-col md:flex-row justify-between items-center gap-6 bg-surface-container-low/30 border-b border-outline/5",children:[e.jsxs("div",{className:"relative w-full md:w-80",children:[e.jsx($t,{className:"absolute right-4 top-1/2 -translate-y-1/2 text-outline/60",size:20}),e.jsx("input",{className:"w-full bg-surface-container-low border border-outline/10 rounded-full pr-12 pl-6 py-3 text-sm font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary/30 outline-none transition-all",placeholder:"بحث عن مادة (اسم أو صيغة)...",value:k,onChange:t=>j(t.target.value)})]}),e.jsx("div",{className:"flex gap-3",children:e.jsx("button",{onClick:()=>z(!w),className:A("p-3 border rounded-full transition-all active:scale-90",w?"bg-primary text-on-primary border-primary shadow-lg shadow-primary/20":"bg-surface-container-low hover:bg-surface-container-high border-outline/10 text-secondary"),title:w?"عرض الكل":"تصفية المواد المنخفضة",children:e.jsx(Wt,{size:22})})})]}),e.jsx("div",{ref:Ge,className:"overflow-auto scrollbar-hide relative max-h-[700px] w-full",children:e.jsxs("table",{className:"w-full text-right border-collapse table-auto relative",children:[e.jsx("thead",{className:"sticky top-0 z-20 bg-surface-container-lowest",children:e.jsxs("tr",{className:"bg-surface-container-low/50 text-secondary/60 text-[11px] font-black uppercase tracking-widest",children:[e.jsx("th",{className:"px-3 py-5 text-right w-12",children:e.jsx("div",{onClick:jt,className:A("w-5 h-5 rounded border-2 cursor-pointer flex items-center justify-center transition-all",T.length===$.length&&$.length>0?"bg-primary border-primary text-white":"border-outline/30 hover:border-primary/50"),children:T.length===$.length&&$.length>0&&e.jsx(Ee,{size:12})})}),e.jsx("th",{className:"px-3 py-5 text-right w-10",children:"#"}),e.jsx("th",{className:"px-3 py-5 text-right min-w-[140px] cursor-pointer hover:text-primary transition-colors",onClick:()=>V("nameEn"),children:e.jsxs("div",{className:"flex items-center",children:[Y("nameEn"),"المادة (EN/AR)"]})}),e.jsx("th",{className:"px-3 py-5 text-right w-16 hidden sm:table-cell cursor-pointer hover:text-primary transition-colors",onClick:()=>V("formula"),children:e.jsxs("div",{className:"flex items-center",children:[Y("formula"),"الصيغة"]})}),e.jsx("th",{className:"px-3 py-5 text-right w-20 cursor-pointer hover:text-primary transition-colors",onClick:()=>V("quantity"),children:e.jsxs("div",{className:"flex items-center",children:[Y("quantity"),"الكمية"]})}),e.jsx("th",{className:"px-3 py-5 text-right w-14 hidden lg:table-cell cursor-pointer hover:text-primary transition-colors",onClick:()=>V("state"),children:e.jsxs("div",{className:"flex items-center",children:[Y("state"),"الحالة"]})}),e.jsx("th",{className:"px-3 py-5 text-right w-18 cursor-pointer hover:text-primary transition-colors",onClick:()=>V("hazardClass"),children:e.jsxs("div",{className:"flex items-center",children:[Y("hazardClass"),"الخطورة"]})}),e.jsx("th",{className:"px-3 py-5 text-right w-20 hidden xl:table-cell",children:"GHS"}),e.jsx("th",{className:"px-3 py-5 text-right w-14 hidden md:table-cell cursor-pointer hover:text-primary transition-colors",onClick:()=>V("shelf"),children:e.jsxs("div",{className:"flex items-center",children:[Y("shelf"),"الرف"]})}),e.jsx("th",{className:"px-3 py-5 text-right w-24 cursor-pointer hover:text-primary transition-colors",onClick:()=>V("expiryDate"),children:e.jsxs("div",{className:"flex items-center",children:[Y("expiryDate"),"الصلاحية"]})}),e.jsx("th",{className:"px-3 py-5 text-right hidden 2xl:table-cell",children:"ملاحظات"}),e.jsx("th",{className:"px-3 py-5 text-center w-24",children:"إجراءات"})]})}),e.jsx("tbody",{className:"divide-y divide-outline/5 relative w-full",children:d?e.jsx("tr",{children:e.jsx("td",{colSpan:12,className:"px-8 py-20 text-center text-outline/60 font-bold",children:"جاري التحميل..."})}):Q.length===0?e.jsx("tr",{children:e.jsx("td",{colSpan:12,className:"px-8 py-20 text-center text-outline/60 font-bold",children:"لا توجد مواد مطابقة للبحث"})}):e.jsxs(e.Fragment,{children:[H.getVirtualItems().length>0&&H.getVirtualItems()[0].start>0&&e.jsx("tr",{children:e.jsx("td",{style:{padding:0,height:`${H.getVirtualItems()[0].start}px`},colSpan:12})}),H.getVirtualItems().map(t=>{var p;const l=t.index,i=Q[l];return e.jsxs("tr",{onClick:()=>S(i),ref:H.measureElement,"data-index":l,className:A("hover:bg-surface-container-low/40 transition-all group cursor-pointer text-base",(o==null?void 0:o.id)===i.id&&"bg-surface-container-low/60 border-r-4 border-primary"),children:[e.jsx("td",{className:"px-3 py-4",children:e.jsx("div",{onClick:x=>{x.stopPropagation(),wt(i.id)},className:A("w-5 h-5 rounded border-2 cursor-pointer flex items-center justify-center transition-all",T.includes(i.id)?"bg-primary border-primary text-white scale-110":"border-outline/30 group-hover:border-primary/50"),children:T.includes(i.id)&&e.jsx(Ee,{size:12})})}),e.jsx("td",{className:"px-3 py-4 font-bold text-secondary/60",children:l+1}),e.jsx("td",{className:"px-3 py-4",children:e.jsxs("div",{className:"flex flex-col",children:[e.jsx("span",{className:"font-black text-primary break-words leading-tight",children:i.nameEn}),e.jsx("span",{className:"text-xs text-secondary/60 break-words mt-0.5",children:i.nameAr})]})}),e.jsx("td",{className:"px-3 py-4 font-mono font-bold text-secondary/80 hidden sm:table-cell text-xs",children:i.formula}),e.jsxs("td",{className:"px-3 py-4 font-black text-primary whitespace-nowrap",children:[i.quantity," ",e.jsx("span",{className:"text-[10px] text-secondary/60",children:i.unit})]}),e.jsx("td",{className:"px-3 py-4 font-bold text-secondary/80 hidden lg:table-cell text-xs",children:i.state==="solid"?"صلب":i.state==="liquid"?"سائل":"غاز"}),e.jsx("td",{className:"px-3 py-4",children:e.jsx("span",{className:A("px-2 py-0.5 rounded-full text-[10px] font-black shadow-sm",i.hazardClass==="danger"?"bg-error-container text-on-error-container":"bg-primary-fixed/40 text-primary"),children:i.hazardClass==="danger"?"خطر":"آمن"})}),e.jsx("td",{className:"px-3 py-4 hidden xl:table-cell",children:e.jsxs("div",{className:"flex gap-1.5",children:[(p=i.ghs)==null?void 0:p.slice(0,3).map((x,u)=>e.jsxs("div",{className:"w-9 h-9 bg-surface rounded-lg flex items-center justify-center border border-outline/20 p-1 shadow-sm hover:scale-125 transition-transform z-10 relative group/ghs",title:pe[x]||x,children:[ee[x]?e.jsx("img",{src:ee[x],alt:x,className:"w-full h-full object-contain",referrerPolicy:"no-referrer"}):e.jsx("span",{className:"text-[8px] font-black",children:x}),e.jsx("div",{className:"absolute bottom-full mb-2 hidden group-hover/ghs:block bg-secondary text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-50 pointer-events-none shadow-xl",children:pe[x]||x})]},u)),i.ghs&&i.ghs.length>3&&e.jsxs("span",{className:"text-[10px] text-secondary/40 self-center font-bold",children:["+",i.ghs.length-3]})]})}),e.jsx("td",{className:"px-3 py-4 font-bold text-primary hidden md:table-cell text-xs",children:i.shelf}),e.jsx("td",{className:"px-3 py-4",children:e.jsxs("span",{className:A("font-bold whitespace-nowrap text-xs",i.expiryDate&&new Date(i.expiryDate)<new Date?"text-error flex items-center gap-1":"text-secondary/80"),children:[ke(i.expiryDate),i.expiryDate&&new Date(i.expiryDate)<new Date&&e.jsx(Ae,{size:14})]})}),e.jsx("td",{className:"px-3 py-4 text-xs text-secondary/60 hidden 2xl:table-cell min-w-[200px] leading-relaxed break-words",children:i.notes}),e.jsx("td",{className:"px-3 py-4 text-center",children:e.jsxs("div",{className:"flex gap-1 justify-center",children:[e.jsx("button",{onClick:x=>{x.stopPropagation(),Re(i)},disabled:M,className:"p-1.5 text-outline/40 hover:text-primary hover:bg-primary/10 transition-all rounded-full active:scale-90",title:"تحديث ذكي",children:e.jsx(oe,{size:16})}),e.jsx("button",{onClick:x=>{x.stopPropagation(),D(i),C({nameEn:i.nameEn,nameAr:i.nameAr,formula:i.formula,casNumber:i.casNumber||"",storageTemp:i.storageTemp||"",unit:i.unit,quantity:i.quantity,state:i.state,hazardClass:i.hazardClass,ghs:i.ghs,shelf:i.shelf,expiryDate:i.expiryDate,notes:i.notes}),E(!0)},className:"p-1.5 text-outline/40 hover:text-primary hover:bg-primary/10 transition-all rounded-full active:scale-90",title:"تعديل",children:e.jsx(Bt,{size:16})}),e.jsx("button",{onClick:x=>{x.stopPropagation(),xt(i.id,i.nameAr)},className:"p-1.5 text-outline/40 hover:text-error hover:bg-error/10 transition-all rounded-full active:scale-90",title:"حذف",children:e.jsx(et,{size:16})})]})})]},i.id)}),H.getVirtualItems().length>0&&H.getTotalSize()-(((qe=(Pe=H.getVirtualItems())==null?void 0:Pe.at(-1))==null?void 0:qe.end)||0)>0&&e.jsx("tr",{children:e.jsx("td",{style:{padding:0,height:`${H.getTotalSize()-(((We=(Ue=H.getVirtualItems())==null?void 0:Ue.at(-1))==null?void 0:We.end)||0)}px`},colSpan:12})})]})})]})})]})}),e.jsxs("div",{className:"lg:col-span-4 space-y-8",children:[o?e.jsxs(G.div,{initial:{opacity:0,x:20},animate:{opacity:1,x:0},className:"bg-surface-container-lowest rounded-[32px] p-10 relative overflow-hidden border border-outline/10 shadow-sm",children:[e.jsx("div",{className:"absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-bl-[120px] -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-700"}),e.jsxs("div",{className:"relative z-10 space-y-8",children:[e.jsxs("div",{className:"flex items-start justify-between",children:[e.jsx("span",{className:A("text-[11px] px-4 py-1.5 rounded-[28px_28px_4px_28px] font-black uppercase tracking-widest shadow-sm",o.hazardClass==="danger"?"bg-error-container text-on-error-container":"bg-tertiary-fixed/60 text-tertiary"),children:o.hazardClass==="danger"?"مادة خطرة":"مادة آمنة"}),o.hazardClass==="danger"&&e.jsx("div",{className:"flex gap-2 text-error animate-pulse",children:e.jsx(Ae,{size:28})})]}),e.jsxs("div",{children:[e.jsx("h2",{className:"text-3xl font-black text-primary mb-1 tracking-tight",children:o.nameEn}),e.jsx("h3",{className:"text-xl font-bold text-secondary mb-2 tracking-tight",children:o.nameAr}),e.jsx("p",{className:"text-lg font-mono font-bold text-secondary/60",children:o.formula})]}),e.jsxs("div",{className:"space-y-5 pt-8 border-t border-outline/5",children:[e.jsxs("div",{className:"flex justify-between items-center",children:[e.jsx("span",{className:"text-base font-bold text-secondary/60 uppercase tracking-widest",children:"رقم CAS"}),e.jsx("span",{className:"font-black text-primary text-lg",children:o.casNumber||"غير متوفر"})]}),e.jsxs("div",{className:"flex justify-between items-center",children:[e.jsx("span",{className:"text-base font-bold text-secondary/60 uppercase tracking-widest",children:"درجة التخزين"}),e.jsx("span",{className:"font-black text-primary text-lg",children:o.storageTemp||"غير متوفر"})]}),e.jsxs("div",{className:"flex justify-between items-center",children:[e.jsx("span",{className:"text-base font-bold text-secondary/60 uppercase tracking-widest",children:"الحالة"}),e.jsx("span",{className:"font-black text-primary text-lg",children:o.state==="solid"?"صلب":o.state==="liquid"?"سائل":"غاز"})]}),e.jsxs("div",{className:"flex justify-between items-center",children:[e.jsx("span",{className:"text-base font-bold text-secondary/60 uppercase tracking-widest",children:"الرف"}),e.jsx("span",{className:"font-black text-primary text-lg",children:o.shelf})]}),e.jsxs("div",{className:"flex justify-between items-center",children:[e.jsx("span",{className:"text-base font-bold text-secondary/60 uppercase tracking-widest",children:"الصلاحية"}),e.jsx("span",{className:A("font-black text-lg",o.expiryDate&&new Date(o.expiryDate)<new Date?"text-error":"text-primary"),children:ke(o.expiryDate)})]}),e.jsxs("div",{className:"flex justify-between items-start",children:[e.jsx("span",{className:"text-base font-bold text-secondary/60 uppercase tracking-widest",children:"ملاحظات"}),e.jsx("span",{className:"font-black text-primary text-sm text-left flex-1 mr-4 leading-relaxed break-words",children:o.notes||"لا توجد"})]}),o.ghs&&o.ghs.length>0&&e.jsxs("div",{className:"pt-6 border-t border-outline/5",children:[e.jsx("span",{className:"text-[11px] font-black text-secondary/40 uppercase tracking-[0.2em] block mb-4",children:"رموز السلامة GHS"}),e.jsx("div",{className:"grid grid-cols-3 gap-4",children:o.ghs.map((t,l)=>e.jsxs("div",{className:"bg-surface p-3 rounded-2xl border border-outline/10 shadow-md hover:shadow-lg hover:border-primary/30 transition-all flex flex-col items-center gap-2 group/card",children:[e.jsx("div",{className:"w-16 h-16 flex items-center justify-center group-hover/card:scale-110 transition-transform",children:ee[t]?e.jsx("img",{src:ee[t],alt:t,className:"w-full h-full object-contain",referrerPolicy:"no-referrer"}):e.jsx("div",{className:"w-full h-full flex items-center justify-center text-xs font-black bg-surface-container-high rounded-xl",children:t})}),e.jsx("span",{className:"text-[10px] font-black text-secondary text-center leading-tight",children:pe[t]||t})]},l))})]}),e.jsxs("div",{className:"space-y-3 pt-2",children:[e.jsxs("div",{className:"flex justify-between items-end",children:[e.jsx("span",{className:"text-sm font-black text-primary uppercase tracking-widest",children:"مستوى المخزون"}),e.jsxs("span",{className:"text-2xl font-black text-primary",children:[o.quantity," ",e.jsx("span",{className:"text-sm text-secondary/60",children:o.unit})]})]}),e.jsx("div",{className:"h-3 w-full bg-surface-container rounded-full overflow-hidden border border-outline/5 shadow-inner",children:e.jsx("div",{className:"h-full bg-primary rounded-full shadow-sm",style:{width:"70%"}})})]})]}),e.jsxs("div",{className:"flex gap-3 pt-4",children:[e.jsx("button",{onClick:()=>vt(o),className:"p-3 bg-surface-container-low hover:bg-surface-container-high border border-outline/10 rounded-full text-primary transition-all active:scale-90",title:"طباعة تعريفية",children:e.jsx(be,{size:22})}),e.jsx("button",{onClick:()=>Se([o]),className:"p-3 bg-surface-container-low hover:bg-surface-container-high border border-outline/10 rounded-full text-primary transition-all active:scale-90",title:"طباعة بطاقة المخزون",children:e.jsx(Ye,{size:22})}),e.jsx("button",{onClick:()=>Re(),disabled:M,className:"p-3 bg-primary-container hover:bg-primary/20 border border-primary/10 rounded-full text-primary transition-all active:scale-90 disabled:opacity-50",title:"تحديث ذكي للمعلومات",children:M?e.jsx("div",{className:"w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin"}):e.jsx(oe,{size:22})}),e.jsx("button",{className:"p-3 bg-surface-container-low hover:bg-surface-container-high border border-outline/10 rounded-full text-primary transition-all active:scale-90",title:"توليد رمز QR",children:e.jsx(Qe,{size:22})})]})]})]},o.id):e.jsx("div",{className:"bg-surface-container-lowest rounded-[32px] p-12 text-center text-outline/60 font-bold border border-outline/10 border-dashed",children:"اختر مادة من القائمة لعرض تفاصيلها المخبرية"}),e.jsxs("div",{className:"bg-primary-container/30 backdrop-blur-sm p-8 rounded-[32px] text-on-primary-container border border-primary/10 relative overflow-hidden group shadow-sm",children:[e.jsxs("div",{className:"relative z-10",children:[e.jsxs("h4",{className:"font-black text-lg mb-3 flex items-center gap-2 text-primary",children:[e.jsx(Ht,{size:20}),"تعليمات السلامة"]}),e.jsx("p",{className:"text-sm font-medium text-primary/80 leading-relaxed",children:(o==null?void 0:o.hazardClass)==="danger"?"يجب ارتداء القفازات والنظارات الواقية عند التعامل مع هذه المادة. يحفظ في مكان بارد وجيد التهوية بعيداً عن مصادر الحرارة.":"يرجى اتباع بروتوكولات المختبر القياسية عند التعامل مع هذه المادة لضمان سلامتك وسلامة الزملاء."})]}),e.jsx(Ae,{className:"absolute -bottom-6 -left-6 text-primary/5 w-32 h-32 rotate-12 group-hover:rotate-0 transition-transform duration-700"})]})]})]}),e.jsx(ce,{children:T.length>0&&e.jsxs(G.div,{initial:{y:100,opacity:0},animate:{y:0,opacity:1},exit:{y:100,opacity:0},className:"fixed bottom-10 left-1/2 -translate-x-1/2 z-50 bg-secondary text-white px-8 py-5 rounded-[32px] shadow-2xl flex items-center gap-10 min-w-[500px]",children:[e.jsxs("div",{className:"flex flex-col",children:[e.jsxs("span",{className:"text-sm font-black",children:[T.length," مادة مختارة"]}),e.jsx("span",{className:"text-[10px] text-white/60 font-bold",children:"يمكنك إجراء عمليات جماعية على هذه المواد"})]}),e.jsx("div",{className:"h-10 w-px bg-surface/10"}),e.jsxs("div",{className:"flex gap-4",children:[e.jsxs("button",{onClick:Nt,className:"flex items-center gap-2 px-6 py-2.5 rounded-full bg-error/20 text-error-container hover:bg-error hover:text-white transition-all font-black text-sm",children:[e.jsx(et,{size:18}),"حذف المختار"]}),e.jsxs("button",{className:"flex items-center gap-2 px-6 py-2.5 rounded-full bg-surface/10 hover:bg-surface/20 transition-all font-black text-sm",onClick:()=>{const t=n.filter(p=>T.includes(p.id)),l=K.json_to_sheet(t.map(p=>({Chemical:p.nameEn,Arabic:p.nameAr,Formula:p.formula,Qty:p.quantity,Unit:p.unit}))),i=K.book_new();K.book_append_sheet(i,l,"SelectedItems"),Ke(i,`selected_chemicals_${new Date().getTime()}.xlsx`)},children:[e.jsx(Ze,{size:18}),"تصدير المختار"]}),e.jsxs("button",{onClick:()=>{const t=n.filter(l=>T.includes(l.id));Se(t)},className:"flex items-center gap-2 px-6 py-2.5 rounded-full bg-primary/20 text-primary-container hover:bg-primary hover:text-white transition-all font-black text-sm",children:[e.jsx(be,{size:18}),"بطاقات المختار"]}),e.jsx("button",{onClick:()=>se([]),className:"p-2.5 hover:bg-surface/10 rounded-full transition-all",children:e.jsx(Ie,{size:20})})]})]})}),e.jsx(ce,{children:R&&e.jsxs("div",{className:"fixed inset-0 z-50 flex items-center justify-center p-4",children:[e.jsx(G.div,{initial:{opacity:0},animate:{opacity:1},exit:{opacity:0},onClick:()=>E(!1),className:"absolute inset-0 bg-primary/20 backdrop-blur-xl"}),e.jsxs(G.div,{initial:{opacity:0,scale:.95,y:20},animate:{opacity:1,scale:1,y:0},exit:{opacity:0,scale:.95,y:20},className:"relative bg-surface w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden border border-outline/10",children:[e.jsxs("div",{className:"p-8 flex justify-between items-center bg-surface-container-low border-b border-outline/5",children:[e.jsx("h3",{className:"text-2xl font-black text-primary",children:I?"تعديل بيانات المادة":"إضافة مادة كيميائية جديدة"}),e.jsx("button",{onClick:()=>{E(!1),D(null),C({nameEn:"",nameAr:"",formula:"",casNumber:"",storageTemp:"",unit:"g",quantity:0,state:"solid",hazardClass:"safe",ghs:[],shelf:"",expiryDate:"",notes:""})},className:"p-2.5 hover:bg-surface-container-high rounded-full transition-all active:scale-90",children:e.jsx(Ie,{size:24})})]}),e.jsxs("form",{onSubmit:ht,className:"p-12 grid grid-cols-1 md:grid-cols-2 gap-8 max-h-[70vh] overflow-y-auto no-scrollbar",children:[e.jsxs("div",{className:"md:col-span-2 flex items-end gap-4",children:[e.jsxs("div",{className:"flex-1 space-y-2",children:[e.jsx("label",{className:"text-xs font-black text-secondary/60 uppercase tracking-widest mr-2",children:"PRODUIT CHIMIQUE"}),e.jsx("input",{required:!0,className:"w-full bg-surface-container-low border border-outline/10 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-primary/20 focus:border-primary/30 outline-none transition-all font-bold",value:g.nameEn||"",onChange:t=>C({...g,nameEn:t.target.value})})]}),e.jsxs("button",{type:"button",onClick:pt,disabled:M,className:"bg-primary-container text-primary px-6 py-4 rounded-2xl flex items-center gap-2 font-black hover:bg-primary/10 transition-all active:scale-95 disabled:opacity-50 h-[58px]",title:"تعبئة ذكية للمعلومات",children:[M?e.jsx("div",{className:"w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin"}):e.jsx(Kt,{size:20}),e.jsx("span",{className:"hidden md:inline",children:"تعبئة ذكية"})]})]}),e.jsxs("div",{className:"space-y-2",children:[e.jsx("label",{className:"text-xs font-black text-secondary/60 uppercase tracking-widest mr-2",children:"الاسم العربي"}),e.jsx("input",{className:"w-full bg-surface-container-low border border-outline/10 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-primary/20 focus:border-primary/30 outline-none transition-all font-bold",value:g.nameAr||"",onChange:t=>C({...g,nameAr:t.target.value})})]}),e.jsxs("div",{className:"space-y-2",children:[e.jsx("label",{className:"text-xs font-black text-secondary/60 uppercase tracking-widest mr-2",children:"الصيغة الكيميائية"}),e.jsx("input",{className:"w-full bg-surface-container-low border border-outline/10 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-primary/20 focus:border-primary/30 outline-none transition-all font-bold",value:g.formula||"",onChange:t=>C({...g,formula:t.target.value})})]}),e.jsxs("div",{className:"space-y-2",children:[e.jsx("label",{className:"text-xs font-black text-secondary/60 uppercase tracking-widest mr-2",children:"رقم CAS"}),e.jsx("input",{className:"w-full bg-surface-container-low border border-outline/10 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-primary/20 focus:border-primary/30 outline-none transition-all font-bold",value:g.casNumber||"",onChange:t=>C({...g,casNumber:t.target.value})})]}),e.jsxs("div",{className:"space-y-2",children:[e.jsx("label",{className:"text-xs font-black text-secondary/60 uppercase tracking-widest mr-2",children:"درجة حرارة التخزين"}),e.jsx("input",{className:"w-full bg-surface-container-low border border-outline/10 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-primary/20 focus:border-primary/30 outline-none transition-all font-bold",value:g.storageTemp||"",onChange:t=>C({...g,storageTemp:t.target.value})})]}),e.jsxs("div",{className:"space-y-2",children:[e.jsx("label",{className:"text-xs font-black text-secondary/60 uppercase tracking-widest mr-2",children:"الحالة"}),e.jsxs("select",{className:"w-full bg-surface-container-low border border-outline/10 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-primary/20 focus:border-primary/30 outline-none transition-all font-bold appearance-none cursor-pointer",value:g.state||"solid",onChange:t=>C({...g,state:t.target.value}),children:[e.jsx("option",{value:"solid",children:"صلب (Solid)"}),e.jsx("option",{value:"liquid",children:"سائل (Liquid)"}),e.jsx("option",{value:"gas",children:"غاز (Gas)"})]})]}),e.jsxs("div",{className:"space-y-2",children:[e.jsx("label",{className:"text-xs font-black text-secondary/60 uppercase tracking-widest mr-2",children:"الكمية"}),e.jsxs("div",{className:"flex gap-3",children:[e.jsx("input",{type:"number",required:!0,className:"flex-1 bg-surface-container-low border border-outline/10 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-primary/20 focus:border-primary/30 outline-none transition-all font-bold",value:g.quantity||0,onChange:t=>C({...g,quantity:Number(t.target.value)})}),e.jsxs("select",{className:"bg-surface-container-low border border-outline/10 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-primary/20 focus:border-primary/30 outline-none transition-all font-bold appearance-none cursor-pointer",value:g.unit||"g",onChange:t=>C({...g,unit:t.target.value}),children:[e.jsx("option",{value:"g",children:"g"}),e.jsx("option",{value:"kg",children:"kg"}),e.jsx("option",{value:"ml",children:"ml"}),e.jsx("option",{value:"L",children:"L"}),e.jsx("option",{value:"unit",children:"Unit"})]})]})]}),e.jsxs("div",{className:"space-y-2",children:[e.jsx("label",{className:"text-xs font-black text-secondary/60 uppercase tracking-widest mr-2",children:"تصنيف الخطورة"}),e.jsxs("select",{className:"w-full bg-surface-container-low border border-outline/10 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-primary/20 focus:border-primary/30 outline-none transition-all font-bold appearance-none cursor-pointer",value:g.hazardClass||"safe",onChange:t=>C({...g,hazardClass:t.target.value}),children:[e.jsx("option",{value:"safe",children:"آمن"}),e.jsx("option",{value:"danger",children:"خطر"})]})]}),e.jsxs("div",{className:"space-y-2",children:[e.jsx("label",{className:"text-xs font-black text-secondary/60 uppercase tracking-widest mr-2",children:"GHS (فواصل بين الرموز)"}),e.jsx("input",{className:"w-full bg-surface-container-low border border-outline/10 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-primary/20 focus:border-primary/30 outline-none transition-all font-bold",placeholder:"GHS01, GHS02...",value:((Be=g.ghs)==null?void 0:Be.join(", "))||"",onChange:t=>C({...g,ghs:t.target.value.split(",").map(l=>l.trim()).filter(Boolean)})})]}),e.jsxs("div",{className:"space-y-2",children:[e.jsx("label",{className:"text-xs font-black text-secondary/60 uppercase tracking-widest mr-2",children:"الرف"}),e.jsx("input",{className:"w-full bg-surface-container-low border border-outline/10 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-primary/20 focus:border-primary/30 outline-none transition-all font-bold",value:g.shelf||"",onChange:t=>C({...g,shelf:t.target.value})})]}),e.jsxs("div",{className:"space-y-2",children:[e.jsx("label",{className:"text-xs font-black text-secondary/60 uppercase tracking-widest mr-2",children:"الصلاحية ⚠"}),e.jsx("input",{type:"date",className:"w-full bg-surface-container-low border border-outline/10 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-primary/20 focus:border-primary/30 outline-none transition-all font-bold",value:g.expiryDate||"",onChange:t=>C({...g,expiryDate:t.target.value})})]}),e.jsxs("div",{className:"md:col-span-2 space-y-2",children:[e.jsx("label",{className:"text-xs font-black text-secondary/60 uppercase tracking-widest mr-2",children:"ملاحظات"}),e.jsx("textarea",{className:"w-full bg-surface-container-low border border-outline/10 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-primary/20 focus:border-primary/30 outline-none transition-all font-bold min-h-[100px]",value:g.notes||"",onChange:t=>C({...g,notes:t.target.value})})]}),e.jsx("div",{className:"md:col-span-2 pt-6",children:e.jsx("button",{type:"submit",className:"w-full bg-primary text-on-primary py-5 rounded-full font-black shadow-xl shadow-primary/20 hover:bg-primary-container hover:shadow-2xl transition-all active:scale-95",children:I?"حفظ التعديلات":"تأكيد إضافة المادة للمخزن"})})]})]})]})}),e.jsx(ce,{children:lt&&e.jsxs("div",{className:"fixed inset-0 z-[100] flex items-center justify-center p-6",children:[e.jsx(G.div,{initial:{opacity:0},animate:{opacity:1},exit:{opacity:0},onClick:()=>ue(!1),className:"absolute inset-0 bg-black/60 backdrop-blur-sm"}),e.jsxs(G.div,{initial:{opacity:0,scale:.9,y:20},animate:{opacity:1,scale:1,y:0},exit:{opacity:0,scale:.9,y:20},className:"relative bg-surface-container-lowest rounded-[32px] p-10 max-w-md w-full shadow-2xl border border-outline/10 text-right",children:[e.jsx("div",{className:"w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-8",children:e.jsx(oe,{size:40,className:"text-primary"})}),e.jsx("h3",{className:"text-3xl font-black text-primary mb-4 tracking-tight",children:"تحديث ذكي شامل"}),e.jsxs("p",{className:"text-secondary/80 text-lg leading-relaxed mb-10",children:["هل أنت متأكد من رغبتك في تحديث معلومات ",e.jsx("span",{className:"font-black text-primary",children:n.length})," مادة ذكياً؟",e.jsx("br",{}),e.jsx("br",{}),"قد تستغرق هذه العملية بعض الوقت. سيتم تحديث البيانات تلقائياً بناءً على اقتراحات الذكاء الاصطناعي."]}),e.jsxs("div",{className:"flex gap-4",children:[e.jsx("button",{onClick:ut,className:"flex-1 bg-primary text-on-primary py-5 rounded-full font-black shadow-xl shadow-primary/20 hover:bg-primary-container hover:shadow-2xl transition-all active:scale-95",children:"بدء التحديث"}),e.jsx("button",{onClick:()=>ue(!1),className:"flex-1 bg-surface border border-outline/20 text-secondary py-5 rounded-full font-black hover:bg-surface-container-high transition-all active:scale-95",children:"إلغاء"})]})]})]})}),e.jsx(ce,{children:ot&&v&&o&&e.jsxs("div",{className:"fixed inset-0 z-[60] flex items-center justify-center p-4",children:[e.jsx(G.div,{initial:{opacity:0},animate:{opacity:1},exit:{opacity:0},onClick:()=>ae(!1),className:"absolute inset-0 bg-primary/20 backdrop-blur-xl"}),e.jsxs(G.div,{initial:{opacity:0,scale:.95,y:20},animate:{opacity:1,scale:1,y:0},exit:{opacity:0,scale:.95,y:20},className:"relative bg-surface w-full max-w-4xl rounded-[40px] shadow-2xl overflow-hidden border border-outline/10",children:[e.jsxs("div",{className:"p-8 flex justify-between items-center bg-surface-container-low border-b border-outline/5",children:[e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx("div",{className:"bg-primary/10 p-2.5 rounded-2xl text-primary",children:e.jsx(oe,{size:24})}),e.jsx("h3",{className:"text-2xl font-black text-primary",children:"مراجعة التحديث الذكي"})]}),e.jsx("button",{onClick:()=>ae(!1),className:"p-2.5 hover:bg-surface-container-high rounded-full transition-all active:scale-90",children:e.jsx(Ie,{size:24})})]}),e.jsxs("div",{className:"p-10 space-y-8 max-h-[70vh] overflow-y-auto no-scrollbar",children:[e.jsx("p",{className:"text-secondary/80 font-bold text-center bg-surface-container-low p-4 rounded-2xl border border-outline/5",children:"تم العثور على معلومات أكثر دقة لهذه المادة. يرجى مراجعة التغييرات المقترحة أدناه قبل الموافقة."}),e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-8",children:[e.jsxs("div",{className:"space-y-6",children:[e.jsx("h4",{className:"text-sm font-black text-secondary/40 uppercase tracking-widest border-b border-outline/5 pb-2",children:"المعلومات الحالية"}),e.jsxs("div",{className:"space-y-4",children:[e.jsxs("div",{className:"bg-surface-container-low/50 p-4 rounded-2xl",children:[e.jsx("label",{className:"text-[10px] font-black text-secondary/40 uppercase block mb-1",children:"الاسم"}),e.jsxs("p",{className:"font-bold text-secondary",children:[o.nameEn," / ",o.nameAr]})]}),e.jsxs("div",{className:"bg-surface-container-low/50 p-4 rounded-2xl",children:[e.jsx("label",{className:"text-[10px] font-black text-secondary/40 uppercase block mb-1",children:"الصيغة"}),e.jsx("p",{className:"font-mono font-bold text-secondary",children:o.formula})]}),e.jsxs("div",{className:"bg-surface-container-low/50 p-4 rounded-2xl",children:[e.jsx("label",{className:"text-[10px] font-black text-secondary/40 uppercase block mb-1",children:"رقم CAS"}),e.jsx("p",{className:"font-bold text-secondary",children:o.casNumber||"غير متوفر"})]}),e.jsxs("div",{className:"bg-surface-container-low/50 p-4 rounded-2xl",children:[e.jsx("label",{className:"text-[10px] font-black text-secondary/40 uppercase block mb-1",children:"درجة التخزين"}),e.jsx("p",{className:"font-bold text-secondary",children:o.storageTemp||"غير متوفر"})]}),e.jsxs("div",{className:"bg-surface-container-low/50 p-4 rounded-2xl",children:[e.jsx("label",{className:"text-[10px] font-black text-secondary/40 uppercase block mb-1",children:"الخطورة"}),e.jsx("p",{className:"font-bold text-secondary",children:o.hazardClass==="danger"?"خطر":"آمن"})]}),e.jsxs("div",{className:"bg-surface-container-low/50 p-4 rounded-2xl",children:[e.jsx("label",{className:"text-[10px] font-black text-secondary/40 uppercase block mb-1",children:"ملاحظات"}),e.jsx("p",{className:"text-xs text-secondary/60",children:o.notes||"لا توجد"})]})]})]}),e.jsxs("div",{className:"space-y-6",children:[e.jsx("h4",{className:"text-sm font-black text-primary uppercase tracking-widest border-b border-primary/10 pb-2",children:"المعلومات المقترحة ✨"}),e.jsxs("div",{className:"space-y-4",children:[e.jsxs("div",{className:A("p-4 rounded-2xl border transition-all",v.nameEn!==o.nameEn||v.nameAr!==o.nameAr?"bg-primary/5 border-primary/20 shadow-sm":"bg-surface-container-low/50 border-transparent"),children:[e.jsx("label",{className:"text-[10px] font-black text-primary/40 uppercase block mb-1",children:"الاسم"}),e.jsxs("p",{className:"font-bold text-primary",children:[v.nameEn," / ",v.nameAr]})]}),e.jsxs("div",{className:A("p-4 rounded-2xl border transition-all",v.formula!==o.formula?"bg-primary/5 border-primary/20 shadow-sm":"bg-surface-container-low/50 border-transparent"),children:[e.jsx("label",{className:"text-[10px] font-black text-primary/40 uppercase block mb-1",children:"الصيغة"}),e.jsx("p",{className:"font-mono font-bold text-primary",children:v.formula})]}),e.jsxs("div",{className:A("p-4 rounded-2xl border transition-all",v.casNumber!==o.casNumber?"bg-primary/5 border-primary/20 shadow-sm":"bg-surface-container-low/50 border-transparent"),children:[e.jsx("label",{className:"text-[10px] font-black text-primary/40 uppercase block mb-1",children:"رقم CAS"}),e.jsx("p",{className:"font-bold text-primary",children:v.casNumber})]}),e.jsxs("div",{className:A("p-4 rounded-2xl border transition-all",v.storageTemp!==o.storageTemp?"bg-primary/5 border-primary/20 shadow-sm":"bg-surface-container-low/50 border-transparent"),children:[e.jsx("label",{className:"text-[10px] font-black text-primary/40 uppercase block mb-1",children:"درجة التخزين"}),e.jsx("p",{className:"font-bold text-primary",children:v.storageTemp})]}),e.jsxs("div",{className:A("p-4 rounded-2xl border transition-all",v.hazardClass!==o.hazardClass?"bg-primary/5 border-primary/20 shadow-sm":"bg-surface-container-low/50 border-transparent"),children:[e.jsx("label",{className:"text-[10px] font-black text-primary/40 uppercase block mb-1",children:"الخطورة"}),e.jsx("p",{className:"font-bold text-primary",children:v.hazardClass==="danger"?"خطر":"آمن"})]}),e.jsxs("div",{className:A("p-4 rounded-2xl border transition-all",v.notes!==o.notes?"bg-primary/5 border-primary/20 shadow-sm":"bg-surface-container-low/50 border-transparent"),children:[e.jsx("label",{className:"text-[10px] font-black text-primary/40 uppercase block mb-1",children:"ملاحظات"}),e.jsx("p",{className:"text-xs text-primary/80",children:v.notes})]})]})]})]})]}),e.jsxs("div",{className:"p-10 bg-surface-container-low border-t border-outline/5 flex gap-4",children:[e.jsxs("button",{onClick:mt,className:"flex-1 bg-primary text-on-primary py-5 rounded-full font-black shadow-xl shadow-primary/20 hover:bg-primary-container hover:shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3",children:[e.jsx(Ee,{size:24}),"موافقة وتحديث البيانات"]}),e.jsxs("button",{onClick:()=>ae(!1),className:"flex-1 bg-surface border border-outline/20 text-secondary py-5 rounded-full font-black hover:bg-surface-container-high transition-all active:scale-95 flex items-center justify-center gap-3",children:[e.jsx(Vt,{size:24}),"إلغاء التغييرات"]})]})]})]})}),e.jsx(ce,{children:dt&&e.jsx(qt,{onClose:()=>Ne(!1),onScan:t=>{Ne(!1);let l=t;t.startsWith("APP_ID_")&&(l=t.split("_").slice(2,-1).join("_")),j(l);const i=n.find(p=>p.id===l||p.id===t);i?(S(i),D(i),E(!0)):alert("عذراً، لم يتم العثور على المادة بهذه الشيفرة.")}})})]})}export{js as default};
