import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { OntologyService } from './services/OntologyService';
import { OntologyController } from './controllers/OntologyController';
import { SparqlController } from './controllers/SparqlController';
import { VerificationService } from './services/VerificationService';

// MulterModule.register({ dest: AppConfig.tempFilePath });

@Module({
  imports: [],
  controllers: [AppController, OntologyController, SparqlController],
  providers: [AppService, OntologyService, VerificationService],
})
export class AppModule {}
