import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      children: [
        {
          path: 'dataframe',
          name: 'DataFrame',
          component: () => import('@/views/DataframeView.vue')
        }
      ]
    }
  ],
})

export default router
