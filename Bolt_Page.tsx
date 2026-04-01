'use client';

import {
  Sparkles, Heart, Eye, Target, Brain, Github, Mail,
  MapPin, Image as LucideImage, Coffee, Bike, Music, Book, Trophy,
  Camera, Code, TrendingUp, GraduationCap, Globe
} from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-full flex items-center justify-center text-white font-bold">
              E
            </div>
            <span className="font-semibold text-lg">Eyre</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm">
            <a href="#home" className="hover:text-blue-500 transition-colors">首页</a>
            <a href="#about" className="hover:text-blue-500 transition-colors">关于我</a>
            <a href="#knowledge" className="hover:text-blue-500 transition-colors">知识空间</a>
            <a href="#skills" className="hover:text-blue-500 transition-colors">技能与生活</a>
            <a href="#contact" className="hover:text-blue-500 transition-colors">联系方式</a>
          </div>
        </div>
      </nav>

      <main className="pt-24 pb-16 px-6">
        <section id="home" className="max-w-7xl mx-auto mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 flex items-center justify-center transition-transform hover:scale-[1.02] duration-300">
              <div className="w-64 h-64 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl"></div>
            </div>

            <div className="bg-white rounded-3xl p-12 shadow-sm border border-slate-100 transition-transform hover:scale-[1.02] duration-300">
              <div className="flex items-center gap-3 mb-6">
                <Sparkles className="w-8 h-8 text-yellow-500" />
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Hi! 我是符航康
                </h1>
              </div>

              <h2 className="text-xl font-semibold mb-4">一名战略驱动、系统化思考、高度务实的机会主义者。</h2>

              <p className="text-slate-600 mb-6 leading-relaxed">
                一名 AI 原生的年轻人，热爱探索未知领域。收集整理有用的知识并分享，持续发现并实现可以由 AI 加速的问题，希望成为一名优秀的智能体工程师。
              </p>

              <div className="flex items-center gap-2 text-slate-600 mb-6">
                <MapPin className="w-5 h-5" />
                <span>湖南大学 2024 级计算机科学与技术「人工智能班」</span>
              </div>

              <div className="flex gap-4">
                <button className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors">
                  <Github className="w-5 h-5" />
                  GitHub
                </button>
                <button className="flex items-center gap-2 px-6 py-3 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors">
                  <Mail className="w-5 h-5" />
                  联系我
                </button>
              </div>

              <div className="mt-8 pt-8 border-t border-slate-100">
                <p className="text-slate-500 italic text-sm">
                  &quot;Dots become lines when the time clicks.&quot;
                </p>
                <p className="text-slate-400 text-xs mt-2">
                  学到的很多东西，都是一个点，我可能现在不知道怎么用，也不能想见它能有什么用，但当某一天我的这些点串联起来。我会把它加速成一条线。
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="about" className="max-w-7xl mx-auto mb-16">
          <div className="flex items-center gap-3 mb-8 justify-center">
            <LucideImage className="w-8 h-8 text-cyan-500" />
            <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
              我跟里的我
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 transition-transform hover:scale-[1.02] duration-300">
              <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mb-4">
                <Heart className="w-7 h-7 text-red-500" />
              </div>
              <p className="text-lg">喜欢做梦，懂得敏感，心思细腻，涉猎广泛</p>
            </div>

            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 transition-transform hover:scale-[1.02] duration-300">
              <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mb-4">
                <Eye className="w-7 h-7 text-blue-500" />
              </div>
              <p className="text-lg">喜欢一切能触动内心的东西</p>
            </div>

            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 transition-transform hover:scale-[1.02] duration-300">
              <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mb-4">
                <Target className="w-7 h-7 text-green-500" />
              </div>
              <p className="text-lg">做点有价值有影响力的事情</p>
            </div>

            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 transition-transform hover:scale-[1.02] duration-300">
              <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center mb-4">
                <Sparkles className="w-7 h-7 text-purple-500" />
              </div>
              <p className="text-lg">把 AI 当作操作系统</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-3xl p-8 shadow-sm border border-slate-100 transition-transform hover:scale-[1.02] duration-300">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-2xl">🤔</span>
                <h3 className="text-xl font-bold">我现在在做什么</h3>
              </div>
              <div className="space-y-3">
                <div className="flex gap-3">
                  <span className="text-green-600 font-semibold">1</span>
                  <p>开拓眼界，爱心观察，广度链接</p>
                </div>
                <div className="flex gap-3">
                  <span className="text-green-600 font-semibold">2</span>
                  <p>开源自我，Build in Public</p>
                </div>
                <div className="flex gap-3">
                  <span className="text-green-600 font-semibold">3</span>
                  <p>研究 AI，研究产品，研究创业</p>
                </div>
                <div className="flex gap-3">
                  <span className="text-green-600 font-semibold">4</span>
                  <p>写点文字，敲点代码，做点计划</p>
                </div>
                <div className="flex gap-3">
                  <span className="text-green-600 font-semibold">5</span>
                  <p>学习如何成为一个靠谱的 IP</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-3xl p-8 shadow-sm border border-slate-100 transition-transform hover:scale-[1.02] duration-300">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-2xl">😊</span>
                <h3 className="text-xl font-bold">我这长的事情</h3>
              </div>
              <div className="space-y-3">
                <div className="flex gap-3">
                  <span className="text-orange-600 font-semibold">1</span>
                  <p>收集数据，整理规律，分享洞察</p>
                </div>
                <div className="flex gap-3">
                  <span className="text-orange-600 font-semibold">2</span>
                  <p>持续学习，保持思考，快速起步</p>
                </div>
                <div className="flex gap-3">
                  <span className="text-orange-600 font-semibold">3</span>
                  <p>观察生活，观察世界，发掘创意</p>
                </div>
                <div className="flex gap-3">
                  <span className="text-orange-600 font-semibold">4</span>
                  <p>即刻起步，小量快跑，迭代优化</p>
                </div>
                <div className="flex gap-3">
                  <span className="text-orange-600 font-semibold">5</span>
                  <p>从他人的经验中学习</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 transition-transform hover:scale-[1.02] duration-300">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-2xl">💫</span>
              <h3 className="text-xl font-bold">我的梦想</h3>
            </div>
            <p className="text-center text-lg leading-relaxed">
              先成为那个能力上百人，乃至上千人公司设计AI流程的大脑，<br />
              再去亲自下场，用自己设计的流程颠覆整个行业。
            </p>
          </div>
        </section>

        <section id="knowledge" className="max-w-7xl mx-auto mb-16">
          <div className="flex items-center gap-3 mb-4 justify-center">
            <span className="text-4xl">⛳</span>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-cyan-600 bg-clip-text text-transparent">
              知识空间
            </h2>
          </div>

          <p className="text-center text-slate-600 mb-4">
            本知识空间汇聚了本人在学习中遇到的一些认为有用的、有趣的资源。
          </p>
          <p className="text-center text-slate-400 text-sm mb-8">
            它会保持更新，不时来看看说不定会有惊喜哦～
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 transition-transform hover:scale-[1.02] duration-300">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-4">
                <Brain className="w-8 h-8 text-blue-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">懂AI</h3>
              <p className="text-slate-600 text-sm">记录了我收集到的 AI 行业的资讯观点与实用工具</p>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 transition-transform hover:scale-[1.02] duration-300">
              <div className="w-16 h-16 bg-pink-100 rounded-2xl flex items-center justify-center mb-4">
                <Coffee className="w-8 h-8 text-pink-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">会工作</h3>
              <p className="text-slate-600 text-sm">记录我个人认同的工作方法与思考</p>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 transition-transform hover:scale-[1.02] duration-300">
              <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mb-4">
                <Heart className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">去生活</h3>
              <p className="text-slate-600 text-sm">记录生活中的琐碎大家分享的一些事件</p>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 transition-transform hover:scale-[1.02] duration-300">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mb-4">
                <Globe className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">观天下</h3>
              <p className="text-slate-600 text-sm">记录脚步支撑过的这片土地</p>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 transition-transform hover:scale-[1.02] duration-300">
              <div className="w-16 h-16 bg-yellow-100 rounded-2xl flex items-center justify-center mb-4">
                <Sparkles className="w-8 h-8 text-yellow-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">悟心理</h3>
              <p className="text-slate-600 text-sm">记录一些与心理、心态相关的内容</p>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 transition-transform hover:scale-[1.02] duration-300">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-4">
                <Code className="w-8 h-8 text-blue-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">说编程</h3>
              <p className="text-slate-600 text-sm">关于编程中的一些原理、规范、方法</p>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 transition-transform hover:scale-[1.02] duration-300">
              <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mb-4">
                <TrendingUp className="w-8 h-8 text-emerald-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">悟商业</h3>
              <p className="text-slate-600 text-sm">关于市场、创业和产品</p>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 transition-transform hover:scale-[1.02] duration-300">
              <div className="w-16 h-16 bg-pink-100 rounded-2xl flex items-center justify-center mb-4">
                <GraduationCap className="w-8 h-8 text-pink-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">当学生</h3>
              <p className="text-slate-600 text-sm">记录我的学生生涯，和一些在这过程中留下的资源</p>
            </div>
          </div>

          <div className="mt-8 bg-blue-50 rounded-3xl p-6 text-center border border-blue-100">
            <p className="text-slate-600">
              第一次访问的朋友，除了浏览太贵的引导，也创造了探索左侧的&quot;知识库目录表&quot;哦！点击分类旁的小三角 📘，可以展开查看更多彩的内容。
            </p>
          </div>
        </section>

        <section id="skills" className="max-w-7xl mx-auto mb-16">
          <div className="flex items-center gap-3 mb-8 justify-center">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-orange-600 bg-clip-text text-transparent">
              我的兴趣爱好
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 transition-transform hover:scale-[1.02] duration-300">
              <div className="w-14 h-14 bg-pink-100 rounded-2xl flex items-center justify-center mb-3">
                <Camera className="w-7 h-7 text-pink-500" />
              </div>
              <p className="font-medium">摄影、剪辑、修图「新手但喜用～」</p>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 transition-transform hover:scale-[1.02] duration-300">
              <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center mb-3">
                <Coffee className="w-7 h-7 text-orange-500" />
              </div>
              <p className="font-medium">探店、吃好吃的「后续或许会发展为做好吃的」</p>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 transition-transform hover:scale-[1.02] duration-300">
              <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mb-3">
                <Bike className="w-7 h-7 text-blue-500" />
              </div>
              <p className="font-medium">夜骑</p>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 transition-transform hover:scale-[1.02] duration-300">
              <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mb-3">
                <Music className="w-7 h-7 text-green-500" />
              </div>
              <p className="font-medium">听歌、调音、唱歌「自娱自乐～」</p>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 transition-transform hover:scale-[1.02] duration-300">
              <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mb-3">
                <Book className="w-7 h-7 text-blue-500" />
              </div>
              <p className="font-medium">阅读、如「文学、科学、逻辑学、心理学、处事哲学」等</p>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 transition-transform hover:scale-[1.02] duration-300">
              <div className="w-14 h-14 bg-yellow-100 rounded-2xl flex items-center justify-center mb-3">
                <Trophy className="w-7 h-7 text-yellow-500" />
              </div>
              <p className="font-medium">羽毛球「菜鸟」</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 transition-transform hover:scale-[1.02] duration-300">
              <h3 className="font-bold text-lg mb-3">提高生活的幸福感与充实感</h3>
              <p className="text-slate-600 text-sm">
                还有什么能比快乐而充实地过好每一天更重要呢？发展自己的爱好，有生活瞬间，让自己变得快乐、幸福。
              </p>
            </div>

            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 transition-transform hover:scale-[1.02] duration-300">
              <h3 className="font-bold text-lg mb-3">不断充盈自己的人生画板</h3>
              <p className="text-slate-600 text-sm">
                体验更多的生活，体验更多的情境，接触更多的人，了解他们，充盈自己的认知世界。一举一叻，一举一多地给这个我人生画添加上更丰富的、鲜艳的、充实的颜色。
              </p>
            </div>

            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 transition-transform hover:scale-[1.02] duration-300">
              <h3 className="font-bold text-lg mb-3">Be who you needed when you were younger</h3>
              <p className="text-slate-600 text-sm">
                帮过去的人，会想为他者行少。
              </p>
            </div>
          </div>
        </section>

        <section id="contact" className="max-w-7xl mx-auto">
          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-3xl p-12 shadow-sm border border-slate-100 transition-transform hover:scale-[1.02] duration-300">
            <div className="flex items-center gap-3 mb-8 justify-center">
              <Trophy className="w-8 h-8 text-yellow-500" />
              <span className="text-2xl">☀️</span>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                2025 年的成就
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/60 backdrop-blur rounded-2xl p-6 border border-white/40">
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">1</div>
                  <p>有了产品意识的启蒙，学会从 Founder 的视角看待问题，全方位锻炼筹力</p>
                </div>
              </div>

              <div className="bg-white/60 backdrop-blur rounded-2xl p-6 border border-white/40">
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">2</div>
                  <p>参加华为云 ASTRO 并取得一等奖</p>
                </div>
              </div>

              <div className="bg-white/60 backdrop-blur rounded-2xl p-6 border border-white/40">
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">3</div>
                  <p>参加中国大学计算机设计大赛并取得省一&国二</p>
                </div>
              </div>

              <div className="bg-white/60 backdrop-blur rounded-2xl p-6 border border-white/40">
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">4</div>
                  <p>参加INU CIT并取得一等奖</p>
                </div>
              </div>

              <div className="bg-white/60 backdrop-blur rounded-2xl p-6 border border-white/40">
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">5</div>
                  <p>为一家年流水上亿公司做AI培训，锻到第一桶金</p>
                </div>
              </div>

              <div className="bg-white/60 backdrop-blur rounded-2xl p-6 border border-white/40">
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">6</div>
                  <p>全栈完成多租户架构门店管理系统开发、部署与运维</p>
                </div>
              </div>

              <div className="bg-white/60 backdrop-blur rounded-2xl p-6 border border-white/40">
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">7</div>
                  <p>接下多个活动的SaaS网页制作外包</p>
                </div>
              </div>

              <div className="bg-white/60 backdrop-blur rounded-2xl p-6 border border-white/40">
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">8</div>
                  <p>开始一场持续二十年的「文明之旅」</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-white border-t border-slate-100 py-8">
        <div className="max-w-7xl mx-auto px-6 text-center text-slate-500 text-sm">
          <p>© 2025 Eyre. Built with Next.js & Tailwind CSS</p>
        </div>
      </footer>
    </div>
  );
}
